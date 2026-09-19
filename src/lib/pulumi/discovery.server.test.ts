import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { getTargetDir, loadPulumiProject } from '@/lib/pulumi/discovery.server'

let projectDir: string

beforeEach(() => {
  projectDir = mkdtempSync(join(tmpdir(), 'pulumi-package-docs-test-'))
})

afterEach(() => {
  rmSync(projectDir, { recursive: true, force: true })
})

function writePulumiYaml(dir: string, contents: string) {
  writeFileSync(join(dir, 'Pulumi.yaml'), contents)
}

describe('loadPulumiProject', () => {
  it('returns null when no Pulumi.yaml is found in the directory tree', () => {
    expect(loadPulumiProject(projectDir)).toBeNull()
  })

  it('reads the project name and runtime from Pulumi.yaml', () => {
    writePulumiYaml(
      projectDir,
      `name: my-project\nruntime: nodejs\ndescription: test\n`,
    )

    const project = loadPulumiProject(projectDir)

    expect(project?.root).toBe(projectDir)
    expect(project?.name).toBe('my-project')
    expect(project?.runtime).toBe('nodejs')
  })

  it('reads the runtime name when runtime is given as an object', () => {
    writePulumiYaml(projectDir, `name: my-project\nruntime:\n  name: nodejs\n`)

    expect(loadPulumiProject(projectDir)?.runtime).toBe('nodejs')
  })

  it('walks up from a subdirectory to find Pulumi.yaml in an ancestor', () => {
    writePulumiYaml(projectDir, `name: my-project\nruntime: nodejs\n`)
    const subDir = join(projectDir, 'a', 'b', 'c')
    mkdirSync(subDir, { recursive: true })

    const project = loadPulumiProject(subDir)

    expect(project?.root).toBe(projectDir)
  })

  it('returns an empty packages list when Pulumi.yaml has no packages section', () => {
    writePulumiYaml(projectDir, `name: my-project\nruntime: nodejs\n`)

    expect(loadPulumiProject(projectDir)?.packages).toEqual([])
  })

  it('parses local/parameterized packages, defaulting source to the package name', () => {
    writePulumiYaml(
      projectDir,
      [
        'name: my-project',
        'runtime: nodejs',
        'packages:',
        '  random:',
        '    source: terraform-provider',
        '    version: 1.4.0',
        '    parameters:',
        '      - hashicorp/random',
        '  aws:',
        '    version: 6.0.0',
        '',
      ].join('\n'),
    )

    const project = loadPulumiProject(projectDir)

    expect(project?.packages).toEqual([
      {
        name: 'random',
        source: 'terraform-provider',
        version: '1.4.0',
        parameters: ['hashicorp/random'],
      },
      {
        name: 'aws',
        source: 'aws',
        version: '6.0.0',
        parameters: undefined,
      },
    ])
  })
})

describe('getTargetDir', () => {
  const originalEnv = process.env.PULUMI_LOCAL_DOCS_DIR

  afterEach(() => {
    if (originalEnv === undefined) delete process.env.PULUMI_LOCAL_DOCS_DIR
    else process.env.PULUMI_LOCAL_DOCS_DIR = originalEnv
  })

  it('returns PULUMI_LOCAL_DOCS_DIR when set', () => {
    process.env.PULUMI_LOCAL_DOCS_DIR = '/some/pulumi/project'
    expect(getTargetDir()).toBe('/some/pulumi/project')
  })

  it('falls back to process.cwd() when unset', () => {
    delete process.env.PULUMI_LOCAL_DOCS_DIR
    expect(getTargetDir()).toBe(process.cwd())
  })
})
