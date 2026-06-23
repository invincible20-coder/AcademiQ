from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
import uuid
from datetime import datetime
from database.models import LearningRoadmap, RoadmapNode, RoadmapProgress, RoadmapStatus, NodeStatus

class RoadmapRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_roadmaps(self, user_id: uuid.UUID) -> List[LearningRoadmap]:
        query = select(LearningRoadmap).where(
            LearningRoadmap.user_id == user_id,
            LearningRoadmap.deleted_at.is_(None)
        ).order_by(LearningRoadmap.created_at.desc())
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_roadmap(self, roadmap_id: uuid.UUID, user_id: uuid.UUID) -> Optional[LearningRoadmap]:
        query = select(LearningRoadmap).where(
            LearningRoadmap.id == roadmap_id,
            LearningRoadmap.user_id == user_id,
            LearningRoadmap.deleted_at.is_(None)
        ).options(
            selectinload(LearningRoadmap.nodes).selectinload(RoadmapNode.progress)
        )
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create_roadmap_stub(
        self, user_id: uuid.UUID, title: str, goal: str, 
        course_id: Optional[uuid.UUID], target_date: Optional[datetime] = None
    ) -> LearningRoadmap:
        roadmap = LearningRoadmap(
            user_id=user_id,
            course_id=course_id,
            title=title,
            goal=goal,
            target_date=target_date,
            status=RoadmapStatus.generating
        )
        self.db.add(roadmap)
        await self.db.commit()
        await self.db.refresh(roadmap)
        return roadmap

    async def update_roadmap_status(self, roadmap_id: uuid.UUID, status: RoadmapStatus):
        roadmap = await self.db.get(LearningRoadmap, roadmap_id)
        if roadmap:
            roadmap.status = status
            await self.db.commit()

    async def clear_roadmap_nodes(self, roadmap_id: uuid.UUID):
        # We delete existing nodes via relationship cascade (or direct query)
        # Assuming we just query and delete to be safe.
        query = select(RoadmapNode).where(RoadmapNode.roadmap_id == roadmap_id)
        result = await self.db.execute(query)
        nodes = result.scalars().all()
        for node in nodes:
            await self.db.delete(node)
        await self.db.commit()

    async def create_node(
        self, 
        roadmap_id: uuid.UUID, 
        title: str, 
        description: str,
        estimated_hours: int,
        difficulty: str,
        priority: str,
        order_index: int,
        mastery_target: int
    ) -> RoadmapNode:
        node = RoadmapNode(
            roadmap_id=roadmap_id,
            title=title,
            description=description,
            estimated_hours=estimated_hours,
            difficulty=difficulty,
            priority=priority,
            order_index=order_index,
            mastery_target=mastery_target
        )
        self.db.add(node)
        # Flush to get the ID, then create progress
        await self.db.flush()
        
        progress = RoadmapProgress(
            roadmap_node_id=node.id,
            user_id=node.roadmap.user_id if getattr(node, 'roadmap', None) else None, # Will populate later
            completion_percentage=0
        )
        # Workaround to get user_id since node.roadmap might not be loaded:
        roadmap = await self.db.get(LearningRoadmap, roadmap_id)
        progress.user_id = roadmap.user_id
        
        self.db.add(progress)
        await self.db.commit()
        return node
        
    async def update_node_progress(self, node_id: uuid.UUID, user_id: uuid.UUID, percentage: int) -> Optional[RoadmapNode]:
        query = select(RoadmapNode).where(
            RoadmapNode.id == node_id
        ).options(selectinload(RoadmapNode.progress), selectinload(RoadmapNode.roadmap))
        
        result = await self.db.execute(query)
        node = result.scalar_one_or_none()
        
        if not node or node.roadmap.user_id != user_id:
            return None
            
        if node.progress:
            node.progress.completion_percentage = percentage
        else:
            node.progress = RoadmapProgress(
                roadmap_node_id=node.id,
                user_id=user_id,
                completion_percentage=percentage
            )
            
        if percentage >= 100:
            node.status = NodeStatus.completed
        elif percentage > 0:
            node.status = NodeStatus.in_progress
        else:
            node.status = NodeStatus.pending
            
        await self.db.commit()
        await self.db.refresh(node)
        
        # Check if entire roadmap is completed
        roadmap = node.roadmap
        all_nodes_query = select(RoadmapNode).where(RoadmapNode.roadmap_id == roadmap.id)
        all_nodes_result = await self.db.execute(all_nodes_query)
        all_nodes = all_nodes_result.scalars().all()
        
        if all(n.status == NodeStatus.completed for n in all_nodes):
            roadmap.status = RoadmapStatus.completed
            await self.db.commit()
            
        return node
