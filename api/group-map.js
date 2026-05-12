import { put, list } from '@vercel/blob';

async function loadBlob(path) {
  try {
    const { blobs } = await list({ prefix: path });
    if (blobs.length === 0) return {};
    const res = await fetch(blobs[0].url);
    return await res.json();
  } catch {
    return {};
  }
}

async function saveBlob(path, data) {
  await put(path, JSON.stringify(data), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
  });
}

// userId → groupId（家庭グループ登録）
export async function getGroupId(userId) {
  const map = await loadBlob('user-groups.json');
  return map[userId] || null;
}

export async function setGroupId(userId, groupId) {
  const map = await loadBlob('user-groups.json');
  map[userId] = groupId;
  await saveBlob('user-groups.json', map);
}

// studentKey → userId（生徒のLINE ID自動登録）
export async function setStudentUserId(studentKey, userId) {
  const map = await loadBlob('student-users.json');
  map[studentKey] = userId;
  await saveBlob('student-users.json', map);
}

export async function getAllStudentUserIds() {
  return await loadBlob('student-users.json');
}
