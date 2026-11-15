const MIN_SECRET_LENGTH = 32;

export const requireSecret = (name) => {
  const value = process.env[name];
  if (!value || value.length < MIN_SECRET_LENGTH) {
    throw new Error(`${name} is required and must be at least ${MIN_SECRET_LENGTH} characters`);
  }
  return value;
};
