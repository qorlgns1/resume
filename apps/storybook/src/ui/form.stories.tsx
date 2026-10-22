import { Button } from "@resume/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@resume/ui/components/field";
import { Input } from "@resume/ui/components/input";
import { Label } from "@resume/ui/components/label";
import { Textarea } from "@resume/ui/components/textarea";
import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = { title: "UI/Form" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const InputStates: Story = {
  name: "Input · 상태",
  render: () => (
    <FieldGroup className="max-w-sm">
      <Field>
        <FieldLabel htmlFor="name">이름</FieldLabel>
        <Input id="name" placeholder="홍길동" />
      </Field>
      <Field data-disabled="true">
        <FieldLabel htmlFor="name-disabled">이름 (비활성)</FieldLabel>
        <Input id="name-disabled" defaultValue="편집할 수 없음" disabled />
      </Field>
      <Field>
        <FieldLabel htmlFor="name-readonly">이름 (읽기 전용)</FieldLabel>
        <Input id="name-readonly" defaultValue="읽기 전용 값" readOnly />
      </Field>
      <Field data-invalid="true">
        <FieldLabel htmlFor="slug">주소 (slug)</FieldLabel>
        <Input
          id="slug"
          defaultValue="My Project"
          aria-invalid="true"
          aria-describedby="slug-error"
        />
        <FieldError id="slug-error">소문자·숫자·하이픈만 사용할 수 있습니다.</FieldError>
      </Field>
    </FieldGroup>
  ),
};

export const TextareaAndLabel: Story = {
  name: "Textarea · Label",
  render: () => (
    <div className="flex max-w-sm flex-col gap-2">
      <Label htmlFor="summary">소개</Label>
      <Textarea id="summary" placeholder="직접 만들고 운영하며, 사용자의 문제를 해결합니다." />
    </div>
  ),
};

export const BasicForm: Story = {
  name: "기본 폼",
  render: () => (
    <form
      className="max-w-md rounded-xl bg-card p-6 shadow-card"
      onSubmit={(e) => e.preventDefault()}
    >
      <FieldSet>
        <FieldLegend>프로젝트 정보</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="title">프로젝트 이름</FieldLabel>
            <Input id="title" required />
            <FieldDescription>목록과 상세 페이지 제목으로 사용합니다.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="tagline">한 줄 소개</FieldLabel>
            <Textarea id="tagline" />
          </Field>
          <Field orientation="horizontal">
            <Button type="submit">저장</Button>
            <Button type="button" variant="outline">
              취소
            </Button>
          </Field>
        </FieldGroup>
      </FieldSet>
    </form>
  ),
};
