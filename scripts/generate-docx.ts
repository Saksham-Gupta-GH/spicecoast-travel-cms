import fs from "fs";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
} from "docx";

const md = fs.readFileSync("Technical_Design_Document.md", "utf8");
const lines = md.split("\n");

const children: any[] = [];

for (const line of lines) {
  if (line.startsWith("# ")) {
    children.push(
      new Paragraph({
        text: line.replace("# ", ""),
        heading: HeadingLevel.TITLE,
        spacing: { before: 240, after: 120 },
      })
    );
  } else if (line.startsWith("## ")) {
    children.push(
      new Paragraph({
        text: line.replace("## ", ""),
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
      })
    );
  } else if (line.startsWith("### ")) {
    children.push(
      new Paragraph({
        text: line.replace("### ", ""),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 180, after: 80 },
      })
    );
  } else if (line.startsWith("* ") || line.startsWith("- ")) {
    children.push(
      new Paragraph({
        text: line.replace(/^[\*\-]\s+/, ""),
        bullet: { level: 0 },
        spacing: { before: 40, after: 40 },
      })
    );
  } else if (line.trim().length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: line.replace(/\*\*/g, ""),
            size: 22,
          }),
        ],
        spacing: { before: 60, after: 60 },
      })
    );
  }
}

const doc = new Document({
  sections: [
    {
      properties: {},
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("Technical_Design_Document.docx", buffer);
  console.log("Technical_Design_Document.docx created successfully!");
});
