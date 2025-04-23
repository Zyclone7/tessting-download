import { User, CustomTreeNodeDatum, LinkData } from '@/types/tree-types';

export function buildHierarchy(users: User[]): CustomTreeNodeDatum {
    const idMap: { [key: number]: CustomTreeNodeDatum } = {};
    const root: { [key: number]: CustomTreeNodeDatum } = {};
  
    users.forEach((user) => {
      idMap[user.ID] = {
        id: user.ID,
        name: user.display_name,
        role: user.user_role,
        level: user.user_level,
        uplineId: user.user_upline_id,
        children: [],
        user: user,
        __rd3t: {
            collapsed: false,
            id: '',
            depth: 0
        }, // Include the required __rd3t property
      };
    });
  
    users.forEach((user) => {
      if (user.user_upline_id === null) {
        root[user.ID] = idMap[user.ID];
      } else {
        const parent = idMap[user.user_upline_id];
        if (parent && parent.children) {
          parent.children.push(idMap[user.ID]);
        }
      }
    });
  
    return Object.values(root)[0];
  }
  

export function stepPath(linkData: LinkData, orientation: string): string {
  const { source, target } = linkData;
  const midY = (source.y + target.y) / 2;

  if (orientation === "vertical") {
    return `M${source.x},${source.y} V${midY} H${target.x} V${target.y}`;
  } else {
    return `M${source.y},${source.x} H${midY} V${target.x} H${target.y}`;
  }
}

export function straightPath(linkData: LinkData, orientation: string): string {
  const { source, target } = linkData;
  if (orientation === "vertical") {
    return `M${source.x},${source.y}L${target.x},${target.y}`;
  } else {
    return `M${source.y},${source.x}L${target.y},${target.x}`;
  }
}

export function searchUsers(term: string, treeData: CustomTreeNodeDatum): CustomTreeNodeDatum[] {
  const searchTermLower = term.toLowerCase();
  const queue: CustomTreeNodeDatum[] = [treeData];
  const results: CustomTreeNodeDatum[] = [];

  while (queue.length > 0) {
    const node = queue.shift();
    if (node) {
      if (
        node.name.toLowerCase().includes(searchTermLower) ||
        node.user.user_email.toLowerCase().includes(searchTermLower) ||
        node.user.user_login.toLowerCase().includes(searchTermLower)
      ) {
        results.push(node);
      }
      if (node.children) {
        queue.push(...node.children);
      }
    }
  }

  return results;
}

