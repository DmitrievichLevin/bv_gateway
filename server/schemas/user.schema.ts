import { EmailField, IdField } from './fields';
import { BevorSchema } from './general';

const UserSchema = BevorSchema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: EmailField,
  vendor: IdField,
  settings: IdField,
});

export { UserSchema };
