export type AutonomyDeepStatusSectionId =
  | 'daemon'
  | 'auto-mode'
  | 'runs'
  | 'flows'
  | 'cron'
  | 'workflow-runs'
  | 'teams'
  | 'pipes'
  | 'runtime'
  | 'remote-control'
  | 'remote-trigger'

export function formatAutonomyDeepStatus(_options?: unknown): string {
  return 'Autonomy/daemon mode is unavailable in personal-local build.'
}

export function formatAutonomyDeepStatusSections(_options?: unknown): Array<{
  id: AutonomyDeepStatusSectionId
  title: string
  content: string
}> {
  return [
    {
      id: 'daemon',
      title: 'Daemon',
      content: 'Unavailable in personal-local build.',
    },
  ]
}
