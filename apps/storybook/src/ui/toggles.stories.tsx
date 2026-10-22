import { Checkbox } from "@resume/ui/components/checkbox";
import { Field, FieldDescription, FieldLabel } from "@resume/ui/components/field";
import { Switch } from "@resume/ui/components/switch";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = { title: "UI/Switch · Checkbox" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const SwitchStates: Story = {
  name: "Switch",
  render: () => (
    <div className="flex max-w-sm flex-col gap-4 rounded-xl bg-card p-5 shadow-card">
      <Field orientation="horizontal" className="justify-between">
        <span className="flex flex-col gap-0.5">
          <FieldLabel htmlFor="sw-on">이름 표시</FieldLabel>
          <FieldDescription>대표 카드에 이름을 보여줍니다.</FieldDescription>
        </span>
        <Switch id="sw-on" defaultChecked />
      </Field>
      <Field orientation="horizontal" className="justify-between">
        <FieldLabel htmlFor="sw-off">모바일에서 숨기기</FieldLabel>
        <Switch id="sw-off" />
      </Field>
      <Field orientation="horizontal" className="justify-between" data-disabled="true">
        <FieldLabel htmlFor="sw-disabled">비활성</FieldLabel>
        <Switch id="sw-disabled" disabled />
      </Field>
    </div>
  ),
};

export const CheckboxStates: Story = {
  name: "Checkbox",
  render: () => (
    <fieldset className="flex max-w-sm flex-col gap-2 rounded-xl bg-card p-5 shadow-card">
      <legend className="mb-2 text-body-sm font-semibold">표시할 프로젝트 (2/3)</legend>
      {[
        { id: "cb-1", label: "타임카드", checked: true },
        { id: "cb-2", label: "책갈피", checked: true },
        { id: "cb-3", label: "단어장", checked: false },
      ].map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <Checkbox id={item.id} defaultChecked={item.checked} />
          <label htmlFor={item.id} className="text-body-sm">
            {item.label}
          </label>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Checkbox id="cb-disabled" disabled />
        <label htmlFor="cb-disabled" className="text-body-sm opacity-50">
          최대 개수에 도달하면 비활성
        </label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="cb-invalid" aria-invalid />
        <label htmlFor="cb-invalid" className="text-body-sm text-destructive">
          오류 상태
        </label>
      </div>
    </fieldset>
  ),
};
