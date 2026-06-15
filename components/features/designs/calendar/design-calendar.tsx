'use client';

import { useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import type { EventInput, EventClickArg } from '@fullcalendar/core';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { STATUS_COLORS, STATUS_LABELS, getDesignContext } from '@/lib/types/design';
import type { Design } from '@/lib/types/design';

interface DesignCalendarProps {
  items: Design[];
  onEventClick?: (item: Design) => void;
}

function DesignCalendar({ items, onEventClick }: DesignCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);

  const events: EventInput[] = items.map((item) => {
    const statusColor = STATUS_COLORS[item.status] || STATUS_COLORS.BACKLOG;
    return {
      id: item.id,
      title: item.title,
      start: item.deadline_at,
      allDay: false,
      backgroundColor: statusColor.background,
      borderColor: statusColor.border,
      textColor: statusColor.text,
      extendedProps: {
        item: item,
      },
    };
  });

  const handleEventClick = (info: EventClickArg) => {
    if (onEventClick) {
      const item = info.event.extendedProps.item as Design;
      onEventClick(item);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4 md:p-6">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventClick}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: '',
        }}
        locales={[esLocale]}
        locale="es"
        firstDay={1}
        height="auto"
        contentHeight="auto"
        eventDisplay="block"
        dayMaxEvents={4}
        moreLinkText="más"
        eventMouseEnter={(info) => {
          const item = info.event.extendedProps.item as Design;
          info.el.title = `${item.title}\n${getDesignContext(item)}\n${item.player}\nEstado: ${STATUS_LABELS[item.status]}\n${format(
            new Date(item.deadline_at),
            "dd 'de' MMMM 'a las' HH:mm",
            { locale: es }
          )}`;
        }}
      />
    </div>
  );
}

export default DesignCalendar;



