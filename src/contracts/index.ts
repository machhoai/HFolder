export type Label = { id: string; name: string };
export type Project = {
  id: string;
  name: string;
  root: string;
  widths: number[];
  types: Label[];
  tags: Label[];
};
export type Entry = {
  id: string;
  relativePath: string;
  parent: string;
  name: string;
  isDir: boolean;
  size: number;
  modified: number;
  code: string | null;
  hidden: boolean;
  excluded: boolean;
  exists: boolean;
  issues: string[];
  kind: string;
  tags: string[];
};
export type ProjectView = {
  project: Project;
  entries: Entry[];
  issueCount: number;
  recoveryRequired: boolean;
};
export type ProjectInput = {
  name: string;
  root: string;
  widths: number[];
  types: string[];
  tags: string[];
};
export type Resolution = {
  id: string;
  description: string;
  kind: string;
  tags: string[];
};
export type AppError = { code: string; detail: string };

export type ChangeInput = {
  id: string;
  description: string | null;
  number: number | null;
  kind: string | null;
  tags: string[] | null;
};
export type ChangeRow = {
  entryId: string;
  before: string;
  after: string;
  code: string;
  kind: string;
  tags: string[];
};
export type ChangePreview = { id: string; changes: ChangeRow[] };
