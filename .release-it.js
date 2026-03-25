module.exports = {
  plugins: {
    "@release-it/bumper": {
      in: ["src-tauri/tauri.*.json", "src-tauri/Cargo.toml"],
      out: ["src-tauri/tauri.*.json", "src-tauri/Cargo.toml"]
    },
    "@release-it/conventional-changelog": {
      preset: {
        name: "conventionalcommits",
        types: [
          { type: "feat", section: "✨ Features | 新功能" },
          { type: "fix", section: "🐛 Bug Fixes | Bug 修复" },
          { type: "chore", section: "🎫 Chores | 其他更新", hidden: true },
          { type: "docs", section: "📝 Documentation | 文档", hidden: true },
          { type: "style", section: "💄 Styles | 风格", hidden: true },
          { type: "refactor", section: "♻️ Code Refactoring | 代码重构", hidden: true },
          { type: "perf", section: "⚡️ Performance Improvements | 性能优化" },
          { type: "test", section: "✅ Tests | 测试", hidden: true },
          { type: "revert", section: "⏪ Reverts | 回退", hidden: true },
          { type: "build", section: "👷‍ Build System | 构建", hidden: true },
          { type: "ci", section: "🔧 Continuous Integration | CI 配置", hidden: true },
          { type: "config", section: "🔨 CONFIG | 配置", hidden: true }
        ]
      },
      whatBump() {
        return { releaseType: false };
      },
      infile: "CHANGELOG.md",
      ignoreRecommendedBump: true,
      strictSemVer: true
    }
  },
  git: {
    commitMessage: "chore: release v${version}"
  },
  npm: {
    publish: false
  },
  github: {
    release: true,
    draft: true,
    releaseName: "v${version}"
  }
};
