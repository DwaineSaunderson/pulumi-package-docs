#!/usr/bin/env node
// Renders Formula/pulumi-package-docs.rb for the homebrew-tap repo from a
// release version and the SHA256 checksums of the four Unix release
// binaries. Run after a release's binaries have been built/downloaded;
// see the `homebrew` job in .github/workflows/publish.yml.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

function parseArgs(argv) {
  const options = {}
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      options[arg.slice(2)] = argv[++i]
    }
  }
  return options
}

const options = parseArgs(process.argv.slice(2))
const required = [
  'version',
  'sha-darwin-arm64',
  'sha-darwin-x64',
  'sha-linux-arm64',
  'sha-linux-x64',
  'out',
]
const missing = required.filter((key) => !options[key])
if (missing.length > 0) {
  console.error(
    `Missing required arguments: ${missing.map((k) => `--${k}`).join(', ')}`,
  )
  process.exit(1)
}

const { version } = options
const repo = 'https://github.com/pierskarsenbarg/pulumi-package-docs'
const releaseUrl = `${repo}/releases/download/v${version}`

const formula = `class PulumiPackageDocs < Formula
  desc "Local documentation viewer for parameterized/local Pulumi providers"
  homepage "${repo}"
  version "${version}"
  license "MIT"

  on_macos do
    on_arm do
      url "${releaseUrl}/pulumi-package-docs-darwin-arm64"
      sha256 "${options['sha-darwin-arm64']}"
    end
    on_intel do
      url "${releaseUrl}/pulumi-package-docs-darwin-x64"
      sha256 "${options['sha-darwin-x64']}"
    end
  end

  on_linux do
    on_arm do
      url "${releaseUrl}/pulumi-package-docs-linux-arm64"
      sha256 "${options['sha-linux-arm64']}"
    end
    on_intel do
      url "${releaseUrl}/pulumi-package-docs-linux-x64"
      sha256 "${options['sha-linux-x64']}"
    end
  end

  def install
    bin.install Dir["pulumi-package-docs-*"].first => "pulumi-package-docs"
  end

  test do
    system "#{bin}/pulumi-package-docs", "--help"
  end
end
`

mkdirSync(dirname(options.out), { recursive: true })
writeFileSync(options.out, formula)
console.log(`Wrote formula for v${version} to ${options.out}`)
