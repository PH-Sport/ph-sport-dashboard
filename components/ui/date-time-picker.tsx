'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  className?: string;
}

// Generate hours array (0-23)
const hours = Array.from({ length: 24 }, (_, i) => i);

// Generate minutes array (0, 15, 30, 45)
const minutes = [0, 15, 30, 45];

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Selecciona fecha y hora',
  disabled = false,
  minDate,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Get current hour and minute from value, default to 12:00
  const selectedHour = value ? value.getHours() : 12;
  const selectedMinute = value ? Math.floor(value.getMinutes() / 15) * 15 : 0;

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(undefined);
      return;
    }

    // Preserve time when selecting new date
    const newDate = new Date(date);
    newDate.setHours(selectedHour, selectedMinute, 0, 0);
    onChange(newDate);
  };

  const handleHourChange = (hour: string) => {
    const h = parseInt(hour, 10);
    const newDate = value ? new Date(value) : new Date();
    newDate.setHours(h, selectedMinute, 0, 0);
    onChange(newDate);
  };

  const handleMinuteChange = (minute: string) => {
    const m = parseInt(minute, 10);
    const newDate = value ? new Date(value) : new Date();
    newDate.setHours(selectedHour, m, 0, 0);
    onChange(newDate);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            format(value, "d MMM yyyy, HH:mm", { locale: es })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateSelect}
          locale={es}
          disabled={minDate ? { before: minDate } : undefined}
          showOutsideDays={false}
        />

        {/* Time selector */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Hora:</span>
            <Select
              value={selectedHour.toString()}
              onValueChange={handleHourChange}
            >
              <SelectTrigger className="h-11 w-[76px] md:h-8 md:w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hours.map((h) => (
                  <SelectItem key={h} value={h.toString()}>
                    {h.toString().padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-muted-foreground">:</span>
            <Select
              value={selectedMinute.toString()}
              onValueChange={handleMinuteChange}
            >
              <SelectTrigger className="h-11 w-[76px] md:h-8 md:w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {minutes.map((m) => (
                  <SelectItem key={m} value={m.toString()}>
                    {m.toString().padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
