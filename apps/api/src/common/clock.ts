export interface Clock {
  now(): Date;
  todayIso(timeZone?: string): string; // "YYYY-MM-DD"
}

export class SystemClock implements Clock {
  constructor(private readonly defaultTimeZone: string = 'Asia/Kolkata') {}

  now(): Date {
    return new Date();
  }

  todayIso(timeZone: string = this.defaultTimeZone): string {
    // Return date string in YYYY-MM-DD in the specified timezone
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(this.now());
  }
}

export class FakeClock implements Clock {
  constructor(
    private fixedDate: Date = new Date(),
    private readonly defaultTimeZone: string = 'Asia/Kolkata',
  ) {}

  now(): Date {
    return new Date(this.fixedDate.getTime());
  }

  setNow(date: Date): void {
    this.fixedDate = new Date(date.getTime());
  }

  todayIso(timeZone: string = this.defaultTimeZone): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(this.fixedDate);
  }
}
