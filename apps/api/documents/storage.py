import os
import uuid
import aiofiles
from fastapi import UploadFile

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

class LocalStorage:
    @staticmethod
    async def save_upload_file(upload_file: UploadFile, user_id: uuid.UUID) -> str:
        # Create a safe unique filename to avoid collisions and path traversal
        file_ext = os.path.splitext(upload_file.filename or "")[1]
        unique_name = f"{user_id}_{uuid.uuid4().hex}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)

        # Write asynchronously
        async with aiofiles.open(file_path, 'wb') as out_file:
            while content := await upload_file.read(1024 * 1024):  # 1MB chunks
                await out_file.write(content)

        return file_path

    @staticmethod
    def delete_file(file_path: str):
        if os.path.exists(file_path) and file_path.startswith(UPLOAD_DIR):
            os.remove(file_path)
