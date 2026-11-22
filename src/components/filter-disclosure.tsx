"use client";

import { useState, type ReactNode } from "react";

export function FilterDisclosure({ count, children }: { count: number; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <div>
    <button className="button secondary filter-toggle" type="button" aria-controls="browse-filters" aria-expanded={open}
      onClick={() => setOpen(!open)}>Filters{count > 0 ? ` (${count})` : ""}</button>
    <div className="stack filter-fields" id="browse-filters" data-open={open}>{children}</div>
  </div>;
}
