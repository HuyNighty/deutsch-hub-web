import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import DOMPurify from "dompurify";
import TextItem from "./TextItem";

const item = { id: "reading", type: "TEXT", title: "Reading", description: "Practice German." };
const allowedTags = ["p", "br", "strong", "b", "em", "i", "ul", "ol", "li"];
const contentElement = () => screen.getByRole("article").querySelector("div");

function expectRestrictedMarkup(content) {
  for (const element of content.querySelectorAll("*")) {
    expect(allowedTags).toContain(element.localName);
    expect(element.attributes).toHaveLength(0);
  }
}

describe("Lesson TEXT rendering safety", () => {
  it("preserves paragraphs, line breaks, bold, emphasis and ordered/unordered lists", () => {
    const content = "<p>Grüße!<br><strong>Important</strong> <b>Bold</b> <em>Emphasis</em> <i>Italic</i></p><ul><li>Hallo</li><li>Tschüss</li></ul><ol><li>First</li><li>Second</li></ol>";
    render(<TextItem item={{ ...item, content }} />);

    expect(contentElement().innerHTML).toBe(content);
    expect(screen.getByRole("heading", { name: "Reading", level: 2 })).toBeVisible();
    expect(screen.getByText("Practice German.")).toBeVisible();
    expect(screen.getAllByRole("list")).toHaveLength(2);
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expectRestrictedMarkup(contentElement());
  });

  it("preserves ordinary plain text and German characters", () => {
    const content = "Grüße aus Köln & München. 2 < 3, 5 > 4.";
    render(<TextItem item={{ ...item, content }} />);
    expect(contentElement().textContent).toBe(content);
    expect(contentElement().children).toHaveLength(0);
  });

  it.each([null, undefined, ""])("renders empty content %j without an HTML fallback", (content) => {
    render(<TextItem item={{ ...item, content }} />);
    expect(contentElement()).toBeEmptyDOMElement();
  });

  it("removes script nodes and their payload instead of relying on inert scripts in jsdom", () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<TextItem item={{ ...item, content: '<script>window.alert("unsafe")</script><p>Keep this lesson.</p><script src="https://example.com/unsafe.js"></script>' }} />);

    expect(contentElement().innerHTML).toBe("<p>Keep this lesson.</p>");
    expect(contentElement().querySelector("script")).toBeNull();
    expect(alert).not.toHaveBeenCalled();
  });

  it("removes event handlers, styles and all other attributes, including data and ARIA attributes", () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<TextItem item={{ ...item, content: '<p onclick="window.alert(1)" onmouseover="window.alert(2)" style="color:red" class="custom" id="location" data-action="unsafe" aria-label="hidden"><strong title="tooltip" onfocus="window.alert(3)">Read safely.</strong></p>' }} />);

    expect(contentElement().innerHTML).toBe("<p><strong>Read safely.</strong></p>");
    expectRestrictedMarkup(contentElement());
    fireEvent.click(screen.getByText("Read safely."));
    fireEvent.mouseOver(screen.getByText("Read safely."));
    expect(alert).not.toHaveBeenCalled();
  });

  it.each([
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    "java&#x09;script:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
  ])("removes links and unsafe URL attributes: %s", (url) => {
    render(<TextItem item={{ ...item, content: `<p><a href="${url}">Lesson link</a></p>` }} />);

    expect(contentElement().innerHTML).toBe("<p>Lesson link</p>");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expectRestrictedMarkup(contentElement());
  });

  it("removes embedded content, foreign namespaces and unapproved formatting while retaining ordinary text", () => {
    const content = '<iframe srcdoc="<script>alert(1)</script>"></iframe><object data="data:text/html,unsafe"></object><embed src="https://example.com"><img src="x" onerror="alert(1)"><video src="x"></video><audio src="x"></audio><svg onload="alert(1)"><circle /></svg><math><mi>x</mi></math><template><img src="x"></template><style>p { color: red; }</style><h3>Lesson heading</h3><p><span>Keep these words.</span> <a href="https://example.com">Reference</a></p>';
    render(<TextItem item={{ ...item, content }} />);

    expect(contentElement()).toHaveTextContent("Lesson heading");
    expect(contentElement()).toHaveTextContent("Keep these words. Reference");
    expect(contentElement().querySelector("iframe, object, embed, img, video, audio, svg, math, template, style, h3, span, a")).toBeNull();
    expectRestrictedMarkup(contentElement());
  });

  it.each([
    '<svg><g/onload=alert(1)//<p>unsafe</p></svg>',
    '<math><mtext><table><mglyph><style><!--</style><img title="--><img src=x onerror=alert(1)>">',
  ])("restricts malformed and namespace-confusion markup: %s", (payload) => {
    render(<TextItem item={{ ...item, content: payload + "<p>Lesson text.</p>" }} />);
    expectRestrictedMarkup(contentElement());
    expect(contentElement().querySelector("script, svg, math, img, style")).toBeNull();
  });

  it("sanitizes again when persisted content changes on the same item", () => {
    const { rerender } = render(<TextItem item={{ ...item, content: "<p>Old lesson.</p>" }} />);
    rerender(<TextItem item={{ ...item, content: '<p onclick="alert(1)">Updated lesson.</p><iframe src="javascript:alert(1)"></iframe>' }} />);

    expect(contentElement().innerHTML).toBe("<p>Updated lesson.</p>");
    expect(screen.queryByText("Old lesson.")).not.toBeInTheDocument();
    expectRestrictedMarkup(contentElement());
  });

  it("passes supplied content through the explicit sanitizer policy and renders only its returned HTML", () => {
    const raw = "<p>Raw lesson content.</p>";
    const sanitize = vi.spyOn(DOMPurify, "sanitize").mockReturnValue("<p>Sanitized lesson.</p>");
    render(<TextItem item={{ ...item, content: raw }} />);

    expect(sanitize).toHaveBeenCalledWith(raw, {
      ALLOWED_TAGS: allowedTags,
      ALLOWED_ATTR: [],
      ALLOW_DATA_ATTR: false,
      ALLOW_ARIA_ATTR: false,
    });
    expect(contentElement().innerHTML).toBe("<p>Sanitized lesson.</p>");
    expect(screen.queryByText("Raw lesson content.")).not.toBeInTheDocument();
  });

  it("uses escaped text when the sanitizer is unsupported, never its unsanitized HTML fallback", () => {
    const supported = DOMPurify.isSupported;
    const sanitize = vi.spyOn(DOMPurify, "sanitize");
    const content = '<p onclick="alert(1)">Lesson</p><img src=x onerror=alert(1)>';
    try {
      DOMPurify.isSupported = false;
      render(<TextItem item={{ ...item, content }} />);
      expect(contentElement().textContent).toBe(content);
      expect(contentElement().children).toHaveLength(0);
      expect(sanitize).not.toHaveBeenCalled();
    } finally {
      DOMPurify.isSupported = supported;
    }
  });

  it("keeps lesson title and description as escaped React text", () => {
    render(<TextItem item={{
      ...item,
      title: '<img src=x onerror="alert(1)">',
      description: "<script>alert(1)</script>",
      content: "<p>Lesson.</p>",
    }} />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent('<img src=x onerror="alert(1)">');
    expect(screen.getByText("<script>alert(1)</script>")).toBeVisible();
    expect(screen.getByRole("article").querySelector("img, script")).toBeNull();
  });
});
