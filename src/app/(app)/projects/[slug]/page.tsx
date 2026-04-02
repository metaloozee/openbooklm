export default function ProjectPage() {
  return (
    <div className="flex w-full flex-1 flex-col p-6">
      <section className="flex flex-1 flex-col items-center justify-center gap-2 border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
        <h1 className="font-heading text-lg font-medium">
          Chat Workspace Soon
        </h1>
        <p className="max-w-sm text-xs text-muted-foreground">
          Use the project controls above to switch spaces, update settings, or
          prepare document uploads.
        </p>
      </section>
    </div>
  );
}
