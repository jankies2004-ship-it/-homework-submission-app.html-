import { put, list } from '@vercel/blob';

const BLOB_PATH = 'user-groups.json';

async function loadMap() {
  try {
    const { blobs } = await list({ prefix: BLOB_PATH });
    if (blobs.length === 0) return {};
    const res = await fetch(blobs[0].url);
    return await res.json();
  } catch {
    return {};
  }
}

export async function getGroupId(userId) {
  const map = await loadMap();
  return map[userId] || null;
}

export async function setGroupId(userId, groupId) {
  const map = await loadMap();
  map[userId] = groupId;
  await put(BLOB_PATH, JSON.stringify(map), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
  });
}
