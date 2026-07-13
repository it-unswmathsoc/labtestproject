"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Content } from "@/lib/admin/types";
import {
  seedContent,
  createTest,
  updateTest,
  deleteTest,
  reorderTests,
} from "@/lib/admin/content-store";
import type { LabTest } from "@/lib/data/types";

const STORAGE_KEY = "labtest:admin:content";

interface AdminStore {
  content: Content;
  addTest: (input: {
    courseId: string;
    name: string;
    term?: string;
    description?: string;
    isPublished: boolean;
  }) => string;
  editTest: (id: string, patch: Partial<Omit<LabTest, "id">>) => void;
  removeTest: (id: string) => void;
  moveTests: (courseId: string, orderedIds: string[]) => void;
}

const AdminStoreContext = createContext<AdminStore | null>(null);

export function AdminStoreProvider({ children }: { children: React.ReactNode }) {
  const [content, setContent] = useState<Content>(seedContent);
  const contentRef = useRef<Content>(content);

  // Hydrate from localStorage after mount (kept out of render so SSR and the
  // client's first paint agree).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Content;
        contentRef.current = parsed;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration
        setContent(parsed);
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  const commit = useCallback((next: Content) => {
    contentRef.current = next;
    setContent(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  }, []);

  const addTest = useCallback<AdminStore["addTest"]>(
    (input) => {
      const { content: next, id } = createTest(contentRef.current, input);
      commit(next);
      return id;
    },
    [commit]
  );

  const editTest = useCallback<AdminStore["editTest"]>(
    (id, patch) => commit(updateTest(contentRef.current, id, patch)),
    [commit]
  );

  const removeTest = useCallback<AdminStore["removeTest"]>(
    (id) => commit(deleteTest(contentRef.current, id)),
    [commit]
  );

  const moveTests = useCallback<AdminStore["moveTests"]>(
    (courseId, orderedIds) =>
      commit(reorderTests(contentRef.current, courseId, orderedIds)),
    [commit]
  );

  return (
    <AdminStoreContext.Provider
      value={{ content, addTest, editTest, removeTest, moveTests }}
    >
      {children}
    </AdminStoreContext.Provider>
  );
}

export function useAdminStore(): AdminStore {
  const store = useContext(AdminStoreContext);
  if (!store) {
    throw new Error("useAdminStore must be used within an AdminStoreProvider");
  }
  return store;
}
