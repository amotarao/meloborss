import type { ItemInterface } from "../app/route";


export function createItemsObj(item: ItemInterface): string {
  const keys = Object.keys(item);
  const values = Object.values(item);
  return keys
    .map((key, i) => {
      if (key === "guid") {
        return `      <${key} isPermaLink="true">${values[i]}</${key}>`;
      }
      return `      <${key}>${values[i]}</${key}>`;
    })
    .join("\n");
}

export function createItemsXml(items: ItemInterface[]): string {
  return items
    .map(
      (item) => `    <item>
${createItemsObj(item)}
    </item>`,
    )
    .join("\n");
}
