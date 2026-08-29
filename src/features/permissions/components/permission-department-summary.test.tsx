import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PermissionDepartmentSummary } from "./permission-department-summary";

const departments = [
  { id: "1", code: "A", nameTh: "แผนก A" },
  { id: "2", code: "B", nameTh: "แผนก B" },
  { id: "3", code: "C", nameTh: "แผนก C" },
];

describe("PermissionDepartmentSummary", () => {
  it("shows every department for an empty restriction list", () => {
    render(<PermissionDepartmentSummary departments={[]} />);
    expect(screen.getByText("ทุกแผนก")).toBeInTheDocument();
  });

  it("shows two department names and the remaining count", () => {
    render(<PermissionDepartmentSummary departments={departments} />);
    expect(screen.getByText("แผนก A")).toBeInTheDocument();
    expect(screen.getByText("แผนก B")).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
    expect(screen.queryByText("แผนก C")).not.toBeInTheDocument();
  });
});
