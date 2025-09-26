import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse as dateFnsParse, startOfWeek, getDay } from "date-fns";
import { parseISO } from "date-fns";
import { utcToZonedTime } from "date-fns-tz";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Localizer setup
const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({
  format,
  parse: dateFnsParse,
  startOfWeek: (date, options) =>
    startOfWeek(date, { weekStartsOn: 1, ...options }),
  getDay,
  locales,
});

export default function CalendarView({
  records,
  currentDate,
  setCurrentDate,
  currentView,
  setCurrentView,
  timeZone, // 👈 add this as a prop
}) {
  const events = records.map((r) => {
    const start = utcToZonedTime(parseISO(r.start), timeZone);
    const end = utcToZonedTime(parseISO(r.end), timeZone);
    return {
      id: r.id,
      title: `${r.name} (${r.type === "Vacation" ? "🌴" : "✈️"})`,
      start,
      end,
      allDay: true,
      type: r.type,
    };
  });

  return (
    <div className="bg-white p-6 rounded-2xl shadow">
      <h2 className="text-xl font-semibold mb-4 text-gray-700 flex items-center gap-2">
        📅 Calendar View
      </h2>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 700 }}
        date={currentDate}
        onNavigate={(date) => setCurrentDate(date)}
        view={currentView}
        onView={(view) => setCurrentView(view)}
        views={["month", "week", "day", "agenda"]}
        defaultView="month"
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: event.type === "Vacation" ? "#22c55e" : "#3b82f6",
            color: "white",
            borderRadius: "8px",
            padding: "2px 4px",
          },
        })}
      />
    </div>
  );
}
