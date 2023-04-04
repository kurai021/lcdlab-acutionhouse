export async function getBlocklist() {
  const blockListFetch = await fetch("/api/blockedRaffles")
  const blockListJson = await blockListFetch.json()
  const data = blockListJson["data"];
  const filtered = data.filter((nft: any) => nft.deleted);
  const map = new Map(filtered);
  return map
}

export async function getAllowList() {
  const blockListFetch = await fetch("/api/raffles")
  const blockListJson = await blockListFetch.json()
  const data = blockListJson["data"];
  return data
}

