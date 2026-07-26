import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>คลิก</Button>);
    expect(screen.getByRole("button", { name: "คลิก" })).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>คลิก</Button>);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("is disabled when loading", () => {
    render(<Button loading>กำลังโหลด</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled when disabled prop is set", () => {
    render(<Button disabled>ปิดใช้งาน</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders left and right icons", () => {
    render(
      <Button leftIcon={<span data-testid="left-icon">+</span>} rightIcon={<span data-testid="right-icon">→</span>}>
        ปุ่ม
      </Button>
    );
    expect(screen.getByTestId("left-icon")).toBeInTheDocument();
    expect(screen.getByTestId("right-icon")).toBeInTheDocument();
  });

  it("hides icons when loading", () => {
    render(
      <Button loading leftIcon={<span data-testid="left-icon">+</span>}>
        กำลังโหลด
      </Button>
    );
    expect(screen.queryByTestId("left-icon")).not.toBeInTheDocument();
  });

  it("applies variant classes", () => {
    const { rerender } = render(<Button variant="destructive">ลบ</Button>);
    let btn = screen.getByRole("button");
    expect(btn.className).toContain("destructive");

    rerender(<Button variant="outline">ยกเลิก</Button>);
    btn = screen.getByRole("button");
    expect(btn.className).toContain("outline");
  });

  it("renders as child when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/test">ลิงก์</a>
      </Button>
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", "/test");
  });
});
