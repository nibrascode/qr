import { create } from "zustand";
import { DEFAULT_DESIGN, type QrDesign, type QrFields, type QrType } from "./types";
import { defaultFields } from "./payload";
import { templateById } from "./templates";

type GeneratorState = {
  type: QrType;
  name: string;
  isDynamic: boolean;
  fields: QrFields;
  design: QrDesign;
  editingId: string | null;
  shortCode: string | null;
  setType: (type: QrType) => void;
  setName: (name: string) => void;
  setDynamic: (v: boolean) => void;
  setField: (key: string, value: string) => void;
  setFields: (fields: QrFields) => void;
  setDesign: (patch: Partial<QrDesign>) => void;
  applyTemplate: (id: string) => boolean;
  loadSaved: (input: {
    id: string;
    type: QrType;
    name: string;
    isDynamic: boolean;
    fields: QrFields;
    design: QrDesign;
    shortCode?: string;
  }) => void;
  reset: () => void;
};

export const useGenerator = create<GeneratorState>((set) => ({
  type: "url",
  name: "",
  isDynamic: false,
  fields: defaultFields("url"),
  design: { ...DEFAULT_DESIGN },
  editingId: null,
  shortCode: null,
  setType: (type) =>
    set({ type, fields: defaultFields(type), name: "", editingId: null, shortCode: null }),
  setName: (name) => set({ name }),
  setDynamic: (isDynamic) => set({ isDynamic }),
  setField: (key, value) =>
    set((s) => ({ fields: { ...s.fields, [key]: value } })),
  setFields: (fields) => set({ fields }),
  setDesign: (patch) => set((s) => ({ design: { ...s.design, ...patch } })),
  applyTemplate: (id) => {
    const t = templateById(id);
    if (!t) return false;
    set({
      type: t.type,
      fields: { ...defaultFields(t.type), ...t.fields },
      design: { ...t.design },
      isDynamic: false,
      editingId: null,
      shortCode: null,
    });
    return true;
  },
  loadSaved: (input) =>
    set({
      editingId: input.id,
      shortCode: input.shortCode ?? null,
      type: input.type,
      name: input.name,
      isDynamic: input.isDynamic,
      fields: input.fields,
      design: input.design,
    }),
  reset: () =>
    set({
      type: "url",
      name: "",
      isDynamic: false,
      fields: defaultFields("url"),
      design: { ...DEFAULT_DESIGN },
      editingId: null,
      shortCode: null,
    }),
}));
