interface PlaceholderContentProps {
  feature: string
}

export function PlaceholderContent({ feature }: PlaceholderContentProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <span className="text-2xl text-muted-foreground">?</span>
        </div>
        <div>
          <h2 className="text-lg font-medium text-foreground">
            {feature} Coming Soon
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This feature is not yet implemented.
          </p>
        </div>
      </div>
    </div>
  )
}
