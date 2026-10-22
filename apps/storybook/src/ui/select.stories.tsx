import { Field, FieldError, FieldLabel } from "@resume/ui/components/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@resume/ui/components/select";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = { title: "UI/Select" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function BackgroundSelect({ disabled, invalid }: { disabled?: boolean; invalid?: boolean }) {
  return (
    <Field className="max-w-xs" data-invalid={invalid ? "true" : undefined}>
      <FieldLabel htmlFor={`bg-${String(disabled)}-${String(invalid)}`}>배경</FieldLabel>
      <Select defaultValue={invalid ? undefined : "surface"} disabled={disabled}>
        <SelectTrigger
          id={`bg-${String(disabled)}-${String(invalid)}`}
          className="w-full"
          aria-invalid={invalid}
        >
          <SelectValue placeholder="배경을 선택하세요" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="surface">흰 카드</SelectItem>
          <SelectItem value="muted">옅은 회색</SelectItem>
          <SelectItem value="inverse">어두운 카드</SelectItem>
          <SelectItem value="transparent">카드 없음</SelectItem>
        </SelectContent>
      </Select>
      {invalid ? <FieldError>배경을 선택해야 합니다.</FieldError> : null}
    </Field>
  );
}

export const Default: Story = { render: () => <BackgroundSelect /> };
export const Disabled: Story = { render: () => <BackgroundSelect disabled /> };
export const Invalid: Story = { render: () => <BackgroundSelect invalid /> };
