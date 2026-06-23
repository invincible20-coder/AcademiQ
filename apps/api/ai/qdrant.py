import os
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from langchain_openai import OpenAIEmbeddings

# Create a local qdrant client
QDRANT_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "qdrant_data")
os.makedirs(QDRANT_PATH, exist_ok=True)

# We use an in-memory or on-disk client for local dev
_client = None

def get_qdrant_client():
    global _client
    if _client is None:
        _client = QdrantClient(path=QDRANT_PATH)
    return _client

COLLECTION_NAME = "documents"

_embeddings = None

def get_embeddings():
    global _embeddings
    if _embeddings is None:
        _embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    return _embeddings

def init_qdrant():
    """Ensure the collection exists."""
    client = get_qdrant_client()
    collections = client.get_collections().collections
    if not any(c.name == COLLECTION_NAME for c in collections):
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=1536, distance=Distance.COSINE),
        )
