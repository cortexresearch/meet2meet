import { customAlphabet } from "nanoid";

// Avoid ambiguous characters (0/O, 1/I/l) for slugs people type/read aloud.
const alphabet = "23456789abcdefghjkmnpqrstuvwxyz";

export const generateSlug = customAlphabet(alphabet, 8);
