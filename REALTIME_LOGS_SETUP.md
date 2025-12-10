# Real-Time Log Streaming Setup

This guide explains how to set up the Azure-style real-time log streaming feature in Mojeeb.

## Frontend Setup (✅ Complete)

The following frontend components have been created:

1. **LogStreamTerminal Component** (`src/features/logs/components/LogStreamTerminal.tsx`)
   - Black terminal-style UI with colored log levels
   - Search functionality
   - Play/Pause controls
   - Download logs as text file
   - Auto-scroll with manual override

2. **useLogStream Hook** (`src/features/logs/hooks/useLogStream.ts`)
   - Connects to Supabase Realtime channel `application-logs`
   - Filters logs by level and agent ID
   - Manages log buffer (max 500-1000 logs)
   - Includes mock log generator for testing

3. **LogsPage** (`src/features/logs/pages/LogsPage.tsx`)
   - Main log viewer page with filters
   - Agent-specific log streaming
   - Application logs vs Web server logs toggle
   - Connection status indicator

## Backend Setup (⚠️ Requires Manual Integration)

### Step 1: Add Realtime Log Sink

The custom Serilog sink has been created at:
- `MojeebBackEnd/Logging/RealtimeLogSink.cs`
- `MojeebBackEnd/Logging/RealtimeLogConfiguration.cs`

### Step 2: Update Program.cs

Add the following code **after** the Supabase client is registered (around line 416):

```csharp
// Add this using statement at the top of Program.cs
using Mojeeb.Logging;

// After line 416 (after Supabase client registration), add:
// Note: We'll initialize Realtime logging after the app is built
```

Then, **after** `var app = builder.Build();` (around line 439), add:

```csharp
// Initialize Realtime logging with Supabase client
using (var scope = app.Services.CreateScope())
{
    var supabaseClient = scope.ServiceProvider.GetRequiredService<Supabase.Client>();

    // Initialize Realtime channel for broadcasting
    await supabaseClient.InitializeAsync();

    // Configure Serilog to broadcast logs to Realtime
    RealtimeLogConfiguration.Initialize(supabaseClient);
}
```

### Step 3: Update Supabase Client Options

Change line 414 from:

```csharp
var options = new Supabase.SupabaseOptions { AutoConnectRealtime = false };
```

To:

```csharp
var options = new Supabase.SupabaseOptions { AutoConnectRealtime = true };
```

## How It Works

### Backend Flow

1. **Serilog Configuration**: All application logs go through Serilog
2. **RealtimeLogSink**: Custom sink batches logs (10 logs or 1 second intervals)
3. **Supabase Broadcast**: Logs are sent to the `application-logs` Realtime channel
4. **Filtering**: Only relevant log levels are broadcast to reduce noise

### Frontend Flow

1. **Supabase Realtime**: Subscribes to `application-logs` channel
2. **User Filtering**: Filters by agent ID and log level
3. **Buffer Management**: Keeps last 500-1000 logs in memory
4. **Terminal Display**: Renders logs in Azure-style terminal UI

### Log Entry Format

```typescript
{
  level: 'critical' | 'error' | 'warning' | 'information' | 'debug',
  message: string,
  source: string,           // e.g., "ChatController", "AuthService"
  correlationId: string,    // Request correlation ID
  timestamp: Date,
  properties: object        // Additional metadata
}
```

## Testing

### Test with Mock Logs (Development Only)

The `useLogStream` hook includes a mock log generator that runs in development mode:
- Generates random logs every 2 seconds
- Tests all log levels
- Includes correlation IDs

To test:
1. Navigate to `/logs` page
2. Logs should appear automatically
3. Test search, filters, play/pause, download

### Test with Real Backend Logs

Once backend is integrated:
1. Start backend with Realtime logging enabled
2. Trigger API calls (login, chat, etc.)
3. Watch logs appear in real-time
4. Test filtering by log level

## Production Considerations

1. **Performance**:
   - Logs are batched to avoid overwhelming Realtime
   - Max buffer size prevents memory issues
   - Auto-scroll can be disabled for heavy loads

2. **Security**:
   - Consider user-level filtering (only show logs for current user's agents)
   - Add role-based access (only admins/super admins see logs)
   - Sanitize sensitive data before logging

3. **Supabase Limits**:
   - Realtime has connection limits per project
   - Consider upgrading plan for production
   - Monitor bandwidth usage

## Future Enhancements

- [ ] Add log persistence (save to database for history)
- [ ] Add log analytics and charts
- [ ] Add alert triggers for critical errors
- [ ] Add log export formats (JSON, CSV)
- [ ] Add log search across all agents
- [ ] Add performance metrics alongside logs

## Troubleshooting

### Logs not appearing
- Check Supabase Realtime is enabled in project settings
- Verify `AutoConnectRealtime = true` in backend
- Check browser console for WebSocket errors
- Verify backend is running and logging events

### Performance issues
- Reduce log buffer size (maxBufferSize)
- Increase batch interval in backend
- Filter to higher log levels only (error, critical)

### Mock logs not stopping
- Mock generator only runs in development
- Set `NODE_ENV=production` to disable
