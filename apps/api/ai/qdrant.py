import os
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from langchain_openai import OpenAIEmbeddings

import threading
import logging

# Create a local qdrant client
QDRANT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "qdrant_data")
os.makedirs(QDRANT_PATH, exist_ok=True)

# Note: local-file Qdrant is incompatible with multi-process Uvicorn workers.
# If running multiple workers, switch to Qdrant server.
_client = None
_client_lock = threading.Lock()

def get_qdrant_client():
    global _client
    with _client_lock:
        if _client is None:
            _client = QdrantClient(path=QDRANT_PATH)
        return _client

def get_collection_name(user_id: str) -> str:
    if not user_id:
        raise ValueError("user_id must be provided and truthy")
    return f"user_{str(user_id).replace('-', '_')}"

_embeddings = None
_embeddings_lock = threading.Lock()

def get_embeddings():
    global _embeddings
    with _embeddings_lock:
        if _embeddings is None:
            _embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        return _embeddings

def init_qdrant(user_id: str):
    """Ensure the collection exists."""
    client = get_qdrant_client()
    collection_name = get_collection_name(user_id)
    collections = client.get_collections().collections
    if not any(c.name == collection_name for c in collections):
        try:
            client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
            )
        except Exception as e:
            if "already exists" in str(e).lower():
                logging.getLogger(__name__).debug(f"Collection {collection_name} already exists.")
            else:
                raise e
