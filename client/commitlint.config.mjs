/** Conventional Commits — see CONTRIBUTING.md for prefix table. */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Allow longer subject lines for commits that mention multiple files /
    // modules. The default 100 cap forces unhelpful truncation.
    "header-max-length": [2, "always", 120],
    // Body lines occasionally need a longer URL or stack trace excerpt.
    "body-max-line-length": [1, "always", 200],
    "footer-max-line-length": [1, "always", 200],
    // Default rejects ProperNouns / acronyms in the subject (file names
    // like "README", "TODO", product names like "Razorpay" / "Supabase").
    // Disable case enforcement — the conventional prefix is enough.
    "subject-case": [0],
  },
};
