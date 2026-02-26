import type { docs_v1 } from "googleapis";

type GDoc = docs_v1.Schema$Document;
type StructuralElement = docs_v1.Schema$StructuralElement;
type ParagraphElement = docs_v1.Schema$ParagraphElement;

export function convertGoogleDocToHtml(doc: GDoc): string {
  const body = doc.body;
  if (!body?.content) return "";

  const html = body.content
    .map((element) => convertStructuralElement(element, doc))
    .filter(Boolean)
    .join("\n");

  return html;
}

function convertStructuralElement(element: StructuralElement, doc: GDoc): string {
  if (element.paragraph) {
    return convertParagraph(element, doc);
  }
  if (element.table) {
    return convertTable(element, doc);
  }
  if (element.tableOfContents) {
    return ""; // skip TOC
  }
  return "";
}

function convertParagraph(element: StructuralElement, _doc: GDoc): string {
  const paragraph = element.paragraph!;
  const style = paragraph.paragraphStyle?.namedStyleType || "NORMAL_TEXT";

  const content = (paragraph.elements || [])
    .map((el) => convertParagraphElement(el))
    .join("");

  if (!content.trim()) return "<br>";

  // Headings
  const headingMap: Record<string, string> = {
    HEADING_1: "h1",
    HEADING_2: "h2",
    HEADING_3: "h3",
    HEADING_4: "h4",
    HEADING_5: "h5",
    HEADING_6: "h6",
  };

  if (headingMap[style]) {
    const tag = headingMap[style];
    return `<${tag}>${content}</${tag}>`;
  }

  // Lists
  if (paragraph.bullet) {
    const nestingLevel = paragraph.bullet.nestingLevel || 0;
    const indent = "  ".repeat(nestingLevel);
    return `${indent}<li>${content}</li>`;
  }

  return `<p>${content}</p>`;
}

function convertParagraphElement(element: ParagraphElement): string {
  if (element.textRun) {
    let text = element.textRun.content || "";
    // Remove trailing newline that Docs adds
    text = text.replace(/\n$/, "");
    if (!text) return "";

    const style = element.textRun.textStyle || {};
    // Escape HTML special chars
    text = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    if (style.bold) text = `<strong>${text}</strong>`;
    if (style.italic) text = `<em>${text}</em>`;
    if (style.underline) text = `<u>${text}</u>`;
    if (style.strikethrough) text = `<del>${text}</del>`;
    if (style.link?.url) text = `<a href="${style.link.url}" target="_blank" rel="noopener">${text}</a>`;

    return text;
  }

  if (element.inlineObjectElement) {
    return "[Image]";
  }

  return "";
}

function convertTable(element: StructuralElement, doc: GDoc): string {
  const table = element.table!;
  const rows = table.tableRows || [];

  const renderCell = (c: docs_v1.Schema$TableCell, tag: string) => {
    const content = (c.content || []).map((el) => convertStructuralElement(el, doc)).join("");
    return `<${tag}>${content}</${tag}>`;
  };

  const headerRow = rows[0]
    ? `<tr>${(rows[0].tableCells || []).map((c) => renderCell(c, "th")).join("")}</tr>`
    : "";

  const bodyRows = rows
    .slice(1)
    .map((row) => `<tr>${(row.tableCells || []).map((c) => renderCell(c, "td")).join("")}</tr>`)
    .join("\n");

  return `<table><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table>`;
}
