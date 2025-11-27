title: 'Error',
  description: 'Failed to disconnect Gmail',
    variant: 'destructive',
      });
    } finally {
  setIsLoading(false);
}
  }

if (isLoading) {
  return null;
}

if (isAuthorized) {
  if (minimal) {
    return (
      <button
        onClick={handleDisconnect}
        className="text-xs font-medium text-slate-500 transition-colors hover:text-red-600 hover:underline"
      >
        Disconnect
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span>Gmail Connected</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDisconnect}
      >
        Disconnect
      </Button>
    </div>
  );
}

return (
  <Button
    onClick={handleConnect}
    variant="outline"
    size="sm"
    className={minimal ? "h-7 px-2.5 py-1 text-xs font-semibold rounded border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-600 hover:text-blue-600" : "gap-2"}
  >
    {!minimal && <Mail className="h-4 w-4" />}
    Connect Gmail
  </Button>
);
}
