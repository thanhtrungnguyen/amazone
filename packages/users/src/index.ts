export {
  updateProfileSchema,
  registerSchema,
  loginSchema,
  type UpdateProfileInput,
  type RegisterInput,
  type LoginInput,
} from "./types";

export {
  getUserById,
  getUserByEmail,
  updateProfile,
  createUser,
} from "./actions";

export {
  generateVerificationToken,
  verifyEmail,
  regenerateVerificationToken,
} from "./verification-actions";

export {
  addressSchema,
  createAddressSchema,
  updateAddressSchema,
  MAX_ADDRESSES_PER_USER,
  type CreateAddressInput,
  type UpdateAddressInput,
  type Address,
} from "./address-types";

export {
  getAddresses,
  getDefaultAddress,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "./address-actions";
