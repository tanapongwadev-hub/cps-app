import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renders text", () => {
    render(<Badge>ใช้งาน</Badge>);
    expect(screen.getByText("ใช้งาน")).toBeInTheDocument();
  });

  it("applies variant class", () => {
    const { container } = render(<Badge variant="success">สำเร็จ</Badge>);
    expect(container.firstChild).toHaveClass("text-success");
  });

  it("applies size class", () => {
    const { container } = render(<Badge size="lg">ใหญ่</Badge>);
    expect(container.firstChild).toHaveClass("text-sm");
  });

  it("accepts custom className", () => {
    const { container } = render(<Badge className="custom-class">Test</Badge>);
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
