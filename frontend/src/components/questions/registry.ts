import type { QuestionType, QuestionTypeDef } from "./types"
import { shortTextType } from "./short_text"
import { longTextType } from "./long_text"
import { multipleChoiceType } from "./multiple_choice"
import { emailType } from "./email"
import { dropdownType } from "./dropdown"
import { numberType } from "./number"
import { phoneNumberType } from "./phone_number"
import { fileUploadType } from "./file_upload"
import { dateType } from "./date"
import { timeType } from "./time"
import { linearScaleType } from "./linear_scale"
import { ratingType } from "./rating"
import { rankingType } from "./ranking"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const QUESTION_TYPES: Record<QuestionType, QuestionTypeDef<any, any>> = {
  short_text: shortTextType,
  long_text: longTextType,
  multiple_choice: multipleChoiceType,
  email: emailType,
  dropdown: dropdownType,
  number: numberType,
  phone_number: phoneNumberType,
  file_upload: fileUploadType,
  date: dateType,
  time: timeType,
  linear_scale: linearScaleType,
  rating: ratingType,
  ranking: rankingType,
}

export const QUESTION_TYPE_ORDER: QuestionType[] = [
  "short_text",
  "long_text",
  "multiple_choice",
  "dropdown",
  "email",
  "number",
  "phone_number",
  "date",
  "time",
  "linear_scale",
  "rating",
  "ranking",
  "file_upload",
]
