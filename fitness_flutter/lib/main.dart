// Flutter Fitness Tracker with Saved Workouts (Templates)
// Features:
// - Month calendar (table_calendar)
// - Add workouts: Run (distance, duration) + Calisthenics (exercise list)
// - Saved Workouts (templates) for Calisthenics: create, edit, delete, and load into new logs
// - Local persistence via Hive
//
// Quick setup:
// 1) flutter create fitness_tracker && cd fitness_tracker
// 2) Replace lib/main.dart with this file
// 3) pubspec.yaml add deps:
//    dependencies:
//      flutter: { sdk: flutter }
//      table_calendar: ^3.1.0
//      hive: ^2.2.3
//      hive_flutter: ^1.1.0
//    dev_dependencies:
//      flutter_test: { sdk: flutter }
//      hive_generator: ^2.0.1
//      build_runner: ^2.4.13
// 4) flutter pub get && dart run build_runner build --delete-conflicting-outputs
// 5) flutter run

import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:hive/hive.dart';
import 'package:hive_flutter/hive_flutter.dart';

part 'main.g.dart'; // generated adapters live here

// ---------------- Models ----------------
@HiveType(typeId: 1)
enum WorkoutType {
  @HiveField(0)
  run,
  @HiveField(1)
  calisthenics,
}

@HiveType(typeId: 2)
class Exercise extends HiveObject {
  @HiveField(0)
  String name;
  @HiveField(1)
  int sets;
  @HiveField(2)
  int reps;
  @HiveField(3)
  double? weightKg;
  Exercise({required this.name, required this.sets, required this.reps, this.weightKg});
}

@HiveType(typeId: 3)
class Workout extends HiveObject {
  @HiveField(0)
  DateTime dateTime;
  @HiveField(1)
  WorkoutType type;
  @HiveField(2)
  int? durationMinutes; // for runs
  @HiveField(3)
  double? distanceKm; // for runs
  @HiveField(4)
  String notes;
  @HiveField(5)
  List<Exercise> exercises; // for calisthenics
  Workout({
    required this.dateTime,
    required this.type,
    this.durationMinutes,
    this.distanceKm,
    this.notes = '',
    this.exercises = const [],
  });
}

// NEW: Calisthenics template (saved workout)
@HiveType(typeId: 4)
class CalisthenicsTemplate extends HiveObject {
  @HiveField(0)
  String name;
  @HiveField(1)
  List<Exercise> exercises;
  CalisthenicsTemplate({required this.name, required this.exercises});
}

// ---------------- App ----------------
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Hive.initFlutter();
  Hive.registerAdapter(WorkoutTypeAdapter());
  Hive.registerAdapter(ExerciseAdapter());
  Hive.registerAdapter(WorkoutAdapter());
  Hive.registerAdapter(CalisthenicsTemplateAdapter());
  await Hive.openBox<Workout>('workouts');
  await Hive.openBox<CalisthenicsTemplate>('templates');
  runApp(const FitnessApp());
}

// ---------------- App shell with 3 tabs ----------------
class FitnessApp extends StatefulWidget {
  const FitnessApp({super.key});
  @override
  State<FitnessApp> createState() => _FitnessAppState();
}

class _FitnessAppState extends State<FitnessApp> {
  int _tabIndex = 0;
  @override
  Widget build(BuildContext context) {
    final tabs = [
      const DashboardScreen(),  // Home
      const HomeScreen(),       // Calendar screen (your existing one)
      const TemplatesScreen(),  // Saved workouts
    ];
    return MaterialApp(
      title: 'Fitness Tracker',
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.teal),
      home: Scaffold(
        body: tabs[_tabIndex],
        bottomNavigationBar: NavigationBar(
          selectedIndex: _tabIndex,
          destinations: const [
            NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
            NavigationDestination(icon: Icon(Icons.calendar_month_outlined), selectedIcon: Icon(Icons.calendar_month), label: 'Calendar'),
            NavigationDestination(icon: Icon(Icons.star_border), selectedIcon: Icon(Icons.star), label: 'Saved'),
          ],
          onDestinationSelected: (i) => setState(() => _tabIndex = i),
        ),
      ),
    );
  }
}

// ---------------- Home Dashboard ----------------
class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final box = Hive.box<Workout>('workouts');
    final today = DateUtils.dateOnly(DateTime.now());
    final dateStr = '${today.year}-${today.month.toString().padLeft(2, '0')}-${today.day.toString().padLeft(2, '0')}';

    return Scaffold(
      appBar: AppBar(title: const Text('Home')),
      body: ValueListenableBuilder(
        valueListenable: box.listenable(),
        builder: (context, Box<Workout> b, _) {
          final all = b.values.toList();
          final last7 = _inRange(all, days: 7);
          final last30 = _inRange(all, days: 30);
          final km7 = _totalKm(last7);
          final min7 = _totalMin(last7);
          final min30 = _totalMin(last30);
          final longestRun = _longestRun(all);
          final favExercise = _favoriteExercise(all);
          final streak = _currentStreakDays(all);

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Header card with date + log button
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(dateStr, style: Theme.of(context).textTheme.titleLarge),
                            const SizedBox(height: 4),
                            Text('Ready to move?', style: Theme.of(context).textTheme.bodyMedium),
                          ],
                        ),
                      ),
                      FilledButton.icon(
                        onPressed: () async {
                          await Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => AddWorkoutScreen(defaultDate: today)),
                          );
                        },
                        icon: const Icon(Icons.add),
                        label: const Text('Log workout'),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Fun metrics grid
              _MetricGrid(children: const [
                // Note: values are built below in _MetricCard by passing strings,
                // so we create them here (not const). We'll rebuild with real data.
              ]),

              // We build metric cards with real values below:
              _MetricGrid(children: [
                _MetricCard(
                  title: 'Streak',
                  value: streak > 0 ? '$streak day${streak == 1 ? '' : 's'} 🔥' : '0 😴',
                  subtitle: 'consecutive days',
                ),
                _MetricCard(
                  title: 'Last 7 days',
                  value: '${last7.length} workouts',
                  subtitle: '${km7.toStringAsFixed(1)} km • $min7 min',
                ),
                _MetricCard(
                  title: 'Longest run',
                  value: longestRun > 0 ? '${longestRun.toStringAsFixed(2)} km 🏁' : '—',
                  subtitle: 'all-time',
                ),
                _MetricCard(
                  title: 'Fav exercise',
                  value: favExercise ?? '—',
                  subtitle: 'most logged',
                ),
                _MetricCard(
                  title: 'Avg duration',
                  value: _avgMin(min30, last30.length),
                  subtitle: 'last 30 days',
                ),
              ]),

              const SizedBox(height: 16),

              // Quick actions
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const HomeScreen())),
                      icon: const Icon(Icons.calendar_month),
                      label: const Text('Open calendar'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const TemplatesScreen())),
                      icon: const Icon(Icons.star),
                      label: const Text('Saved workouts'),
                    ),
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }
}

class _MetricGrid extends StatelessWidget {
  final List<Widget> children;
  const _MetricGrid({required this.children});
  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, c) {
        final isWide = c.maxWidth > 680;
        final crossAxisCount = isWide ? 3 : 2;
        return GridView.count(
          crossAxisCount: crossAxisCount,
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.6,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          children: children,
        );
      },
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String title;
  final String value;
  final String? subtitle;
  const _MetricCard({required this.title, required this.value, this.subtitle});
  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(title, style: Theme.of(context).textTheme.labelLarge?.copyWith(color: Colors.black54)),
            const SizedBox(height: 8),
            Text(value, style: Theme.of(context).textTheme.titleLarge),
            if (subtitle != null) ...[
              const SizedBox(height: 4),
              Text(subtitle!, style: Theme.of(context).textTheme.bodySmall),
            ],
          ],
        ),
      ),
    );
  }
}

// ---------------- Dashboard helpers ----------------
List<Workout> _inRange(List<Workout> all, {required int days}) {
  final now = DateTime.now();
  final start = DateTime(now.year, now.month, now.day).subtract(Duration(days: days - 1));
  return all.where((w) => w.dateTime.isAfter(start.subtract(const Duration(milliseconds: 1)))).toList();
}

double _totalKm(List<Workout> list) =>
    list.where((w) => w.type == WorkoutType.run).fold<double>(0, (s, w) => s + (w.distanceKm ?? 0));

int _totalMin(List<Workout> list) => list.fold<int>(0, (s, w) => s + (w.durationMinutes ?? 0));

double _longestRun(List<Workout> all) {
  double best = 0;
  for (final w in all) {
    if (w.type == WorkoutType.run && (w.distanceKm ?? 0) > best) best = w.distanceKm ?? 0;
  }
  return best;
}

String? _favoriteExercise(List<Workout> all) {
  final counts = <String, int>{};
  for (final w in all) {
    if (w.type == WorkoutType.calisthenics) {
      for (final e in w.exercises) {
        counts.update(e.name, (v) => v + 1, ifAbsent: () => 1);
      }
    }
  }
  if (counts.isEmpty) return null;
  counts.removeWhere((k, v) => k.trim().isEmpty);
  final sorted = counts.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
  return sorted.isEmpty ? null : sorted.first.key;
}

String _avgMin(int totalMin, int count) {
  if (count == 0) return '—';
  final avg = (totalMin / count).round();
  return '$avg min';
}

int _currentStreakDays(List<Workout> all) {
  // Count consecutive days with at least one workout. If none today, show yesterday-based streak.
  final daysWith = all.map((w) => DateUtils.dateOnly(w.dateTime)).toSet().toList()..sort();
  if (daysWith.isEmpty) return 0;
  int streak = 0;
  DateTime cursor = DateUtils.dateOnly(DateTime.now());
  while (daysWith.contains(cursor)) {
    streak++;
    cursor = cursor.subtract(const Duration(days: 1));
  }
  if (streak == 0) {
    cursor = DateUtils.dateOnly(DateTime.now()).subtract(const Duration(days: 1));
    while (daysWith.contains(cursor)) {
      streak++;
      cursor = cursor.subtract(const Duration(days: 1));
    }
  }
  return streak;
}

// ---- Your existing calendar screen continues below ----
// class HomeScreen ...
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  DateTime _focused = DateTime.now();
  DateTime? _selected;

  @override
  void initState() {
    super.initState();
    _selected = DateUtils.dateOnly(DateTime.now());
  }

@override
Widget build(BuildContext context) {
  final box = Hive.box<Workout>('workouts');
  return Scaffold(
    appBar: AppBar(title: const Text('Your Training')),
    body: ValueListenableBuilder(
      valueListenable: box.listenable(),
      builder: (context, Box<Workout> b, _) {
        final all = b.values.toList();
        final markers = _workoutMarkers(all);
        final selected = _selected ?? DateUtils.dateOnly(DateTime.now());
        final dayWorkouts = all
            .where((w) => DateUtils.isSameDay(DateUtils.dateOnly(w.dateTime), selected))
            .toList()
          ..sort((a, b) => a.dateTime.compareTo(b.dateTime));

        final runKm = dayWorkouts
            .where((w) => w.type == WorkoutType.run)
            .fold<double>(0, (sum, w) => sum + (w.distanceKm ?? 0));
        final totalMin = dayWorkouts.fold<int>(0, (sum, w) => sum + (w.durationMinutes ?? 0));

        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: TableCalendar<Workout>(
                firstDay: DateTime.utc(2015, 1, 1),
                lastDay: DateTime.utc(2100, 12, 31),
                focusedDay: _focused,
                selectedDayPredicate: (day) => DateUtils.isSameDay(day, _selected),
                onDaySelected: (sel, foc) => setState(() {
                  _selected = DateUtils.dateOnly(sel);
                  _focused = foc;
                }),
                eventLoader: (day) => markers[DateUtils.dateOnly(day)] ?? [],
                calendarStyle: const CalendarStyle(
                  markerDecoration: BoxDecoration(shape: BoxShape.circle),
                ),
              ),
            ),

            // 👇 This Padding wrapper was missing
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _dateLabel(selected),
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        Text(
                          '${dayWorkouts.length} workout(s)',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  if (runKm > 0) Text('${runKm.toStringAsFixed(2)} km'),
                  const SizedBox(width: 12),
                  if (totalMin > 0) Text('$totalMin min'),
                ],
              ),
            ),

            const Divider(height: 0),
            Expanded(
              child: dayWorkouts.isEmpty
                  ? const Center(child: Text('No workouts. Tap + to add.'))
                  : ListView.separated(
                      itemCount: dayWorkouts.length,
                      separatorBuilder: (_, __) => const Divider(height: 0),
                      itemBuilder: (c, i) => _WorkoutTile(
                        workout: dayWorkouts[i],
                        onDelete: () {
                          dayWorkouts[i].delete();
                          setState(() {});
                        },
                        onEdit: () async {
                          await Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => EditWorkoutScreen(workout: dayWorkouts[i]),
                            ),
                          );
                          setState(() {});
                        },
                      ),
                    ),
            ),
          ],
        );
      },
    ),
    floatingActionButton: FloatingActionButton.extended(
      onPressed: () async {
        await Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => AddWorkoutScreen(
              defaultDate: _selected ?? DateTime.now(),
            ),
          ),
        );
        setState(() {});
      },
      label: const Text('Add'),
      icon: const Icon(Icons.add),
    ),
  );
}

  Future<bool> _confirmDelete(
      BuildContext context, int count, DateTime day) async {
    final label =
        '${day.year}-${day.month.toString().padLeft(2, '0')}-${day.day.toString().padLeft(2, '0')}';
    return await showDialog<bool>(
          context: context,
          builder: (c) => AlertDialog(
            title: const Text('Delete workouts?'),
            content: Text('Remove $count workout(s) on $label? This cannot be undone.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Cancel')),
              FilledButton(
                  onPressed: () => Navigator.pop(c, true),
                  child: const Text('Delete')),
            ],
          ),
        ) ??
        false;
  }

  Map<DateTime, List<Workout>> _workoutMarkers(List<Workout> all) {
    final map = <DateTime, List<Workout>>{};
    for (final w in all) {
      final d = DateUtils.dateOnly(w.dateTime);
      map.putIfAbsent(d, () => []).add(w);
    }
    return map;
  }

  String _dateLabel(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}

class _WorkoutTile extends StatelessWidget {
  final Workout workout;
  final VoidCallback onDelete;
  final VoidCallback onEdit;
  const _WorkoutTile({required this.workout, required this.onDelete, required this.onEdit});
  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Text(workout.type == WorkoutType.run ? '🏃' : '🤸', style: const TextStyle(fontSize: 20)),
      title: Text(workout.type == WorkoutType.run ? 'Run' : 'Calisthenics'),
      subtitle: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (workout.type == WorkoutType.run)
          Wrap(spacing: 12, children: [
            if (workout.distanceKm != null) Text('${workout.distanceKm!.toStringAsFixed(2)} km'),
            if (workout.durationMinutes != null) Text('${workout.durationMinutes} min'),
          ]),
        if (workout.type == WorkoutType.calisthenics && workout.exercises.isNotEmpty)
          Text(workout.exercises.map((e) => '${e.name} ${e.sets}x${e.reps}${e.weightKg != null ? ' @ ${e.weightKg}kg' : ''}').join(', '), maxLines: 1, overflow: TextOverflow.ellipsis),
        if (workout.notes.isNotEmpty) Text(workout.notes, maxLines: 1, overflow: TextOverflow.ellipsis),
      ]),
      trailing: Text(TimeOfDay.fromDateTime(workout.dateTime).format(context), style: const TextStyle(color: Colors.black54)),
      onTap: onEdit,
      onLongPress: onDelete,
    );
  }
}

// ---------------- Add/Edit Screens ----------------
class AddWorkoutScreen extends StatefulWidget {
  final DateTime defaultDate;
  const AddWorkoutScreen({super.key, required this.defaultDate});
  @override
  State<AddWorkoutScreen> createState() => _AddWorkoutScreenState();
}

class _AddWorkoutScreenState extends State<AddWorkoutScreen> {
  DateTime _dateTime = DateTime.now();
  WorkoutType _type = WorkoutType.run;
  int _duration = 30;
  double _distance = 5;
  String _notes = '';
  final List<Exercise> _exercises = [];

  @override
  void initState() {
    super.initState();
    _dateTime = DateTime(widget.defaultDate.year, widget.defaultDate.month, widget.defaultDate.day, TimeOfDay.now().hour, TimeOfDay.now().minute);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add Workout')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _datePicker(),
          const SizedBox(height: 8),
          SegmentedButton<WorkoutType>(
            segments: const [
              ButtonSegment(value: WorkoutType.run, label: Text('Run'), icon: Icon(Icons.directions_run)),
              ButtonSegment(value: WorkoutType.calisthenics, label: Text('Calisthenics'), icon: Icon(Icons.fitness_center)),
            ],
            selected: {_type},
            onSelectionChanged: (s) => setState(() => _type = s.first),
          ),
          const SizedBox(height: 12),
          if (_type == WorkoutType.run) _runFields() else _calisthenicsFields(),
          const SizedBox(height: 12),
          TextField(decoration: const InputDecoration(labelText: 'Notes'), maxLines: 3, onChanged: (v) => _notes = v),
          const SizedBox(height: 16),
          FilledButton.icon(onPressed: _save, icon: const Icon(Icons.save), label: const Text('Save')),
        ],
      ),
    );
  }

  Widget _datePicker() {
    return Row(children: [
      Expanded(child: Text('${_dateTime.year}-${_dateTime.month.toString().padLeft(2, '0')}-${_dateTime.day.toString().padLeft(2, '0')}  ${TimeOfDay.fromDateTime(_dateTime).format(context)}')),
      IconButton(onPressed: () async {
        final d = await showDatePicker(context: context, firstDate: DateTime(2015), lastDate: DateTime(2100), initialDate: _dateTime);
        if (d == null) return;
        final t = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(_dateTime));
        setState(() => _dateTime = DateTime(d.year, d.month, d.day, (t?.hour ?? 0), (t?.minute ?? 0)));
      }, icon: const Icon(Icons.calendar_today))
    ]);
  }

  Widget _runFields() {
    return Column(children: [
      Row(children: [
        Expanded(child: _numberField(label: 'Distance (km)', value: _distance.toStringAsFixed(1), onChanged: (v) => _distance = double.tryParse(v) ?? _distance)),
        const SizedBox(width: 12),
        Expanded(child: _numberField(label: 'Duration (min)', value: '$_duration', onChanged: (v) => _duration = int.tryParse(v) ?? _duration)),
      ]),
    ]);
  }

  Widget _calisthenicsFields() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        OutlinedButton.icon(onPressed: _loadTemplate, icon: const Icon(Icons.star), label: const Text('Load from saved')),
        const SizedBox(width: 8),
        OutlinedButton.icon(onPressed: _saveAsTemplate, icon: const Icon(Icons.star_border), label: const Text('Save as template')),
      ]),
      const SizedBox(height: 8),
      if (_exercises.isEmpty) const Text('Add your first exercise below.', style: TextStyle(color: Colors.black54)),
      ..._exercises.map((e) => ListTile(title: Text(e.name), subtitle: Text('${e.sets}x${e.reps}${e.weightKg != null ? ' @ ${e.weightKg}kg' : ''}'), trailing: IconButton(icon: const Icon(Icons.delete_outline), onPressed: () { setState(() { _exercises.remove(e); }); }))),
      const SizedBox(height: 8),
      _ExerciseAdder(onAdd: (ex) => setState(() => _exercises.add(ex))),
    ]);
  }

  Widget _numberField({required String label, required String value, required ValueChanged<String> onChanged}) {
    final controller = TextEditingController(text: value);
    return TextField(decoration: InputDecoration(labelText: label), keyboardType: TextInputType.numberWithOptions(decimal: true), controller: controller, onChanged: onChanged);
  }

  Future<void> _save() async {
    final box = Hive.box<Workout>('workouts');
    final w = Workout(
      dateTime: _dateTime,
      type: _type,
      durationMinutes: _type == WorkoutType.run ? _duration : null,
      distanceKm: _type == WorkoutType.run ? _distance : null,
      notes: _notes,
      exercises: _type == WorkoutType.calisthenics ? List.of(_exercises) : [],
    );
    await box.add(w);
    if (mounted) Navigator.of(context).pop();
  }

  Future<void> _loadTemplate() async {
    final selected = await Navigator.of(context).push<CalisthenicsTemplate>(MaterialPageRoute(builder: (_) => const SelectTemplateScreen()));
    if (selected != null) {
      setState(() {
        _exercises
          ..clear()
          ..addAll(selected.exercises.map((e) => Exercise(name: e.name, sets: e.sets, reps: e.reps, weightKg: e.weightKg)));
      });
    }
  }

  Future<void> _saveAsTemplate() async {
    if (_exercises.isEmpty) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Add at least one exercise first.')));
      return;
    }
    final name = await _askForName(context, hint: 'Full Body A');
    if (name == null || name.trim().isEmpty) return;
    final box = Hive.box<CalisthenicsTemplate>('templates');
    final tpl = CalisthenicsTemplate(name: name.trim(), exercises: _exercises.map((e) => Exercise(name: e.name, sets: e.sets, reps: e.reps, weightKg: e.weightKg)).toList());
    await box.add(tpl);
    if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Saved "$name"')));
  }
}

class EditWorkoutScreen extends StatefulWidget {
  final Workout workout;
  const EditWorkoutScreen({super.key, required this.workout});
  @override
  State<EditWorkoutScreen> createState() => _EditWorkoutScreenState();
}

class _EditWorkoutScreenState extends State<EditWorkoutScreen> {
  late DateTime _dateTime;
  late WorkoutType _type;
  int _duration = 0;
  double _distance = 0;
  String _notes = '';
  late List<Exercise> _exercises;

  @override
  void initState() {
    super.initState();
    final w = widget.workout;
    _dateTime = w.dateTime;
    _type = w.type;
    _duration = w.durationMinutes ?? 0;
    _distance = w.distanceKm ?? 0;
    _notes = w.notes;
    _exercises = List.of(w.exercises);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit Workout')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(children: [
            Expanded(child: Text('${_dateTime.year}-${_dateTime.month.toString().padLeft(2, '0')}-${_dateTime.day.toString().padLeft(2, '0')}  ${TimeOfDay.fromDateTime(_dateTime).format(context)}')),
            IconButton(onPressed: () async {
              final d = await showDatePicker(context: context, firstDate: DateTime(2015), lastDate: DateTime(2100), initialDate: _dateTime);
              if (d == null) return;
              final t = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(_dateTime));
              setState(() => _dateTime = DateTime(d.year, d.month, d.day, (t?.hour ?? 0), (t?.minute ?? 0)));
            }, icon: const Icon(Icons.calendar_today))
          ]),
          const SizedBox(height: 8),
          SegmentedButton<WorkoutType>(
            segments: const [
              ButtonSegment(value: WorkoutType.run, label: Text('Run'), icon: Icon(Icons.directions_run)),
              ButtonSegment(value: WorkoutType.calisthenics, label: Text('Calisthenics'), icon: Icon(Icons.fitness_center)),
            ],
            selected: {_type},
            onSelectionChanged: (s) => setState(() => _type = s.first),
          ),
          const SizedBox(height: 12),
          if (_type == WorkoutType.run)
            Row(children: [
              Expanded(child: _numberField(label: 'Distance (km)', value: _distance.toStringAsFixed(1), onChanged: (v) => _distance = double.tryParse(v) ?? _distance)),
              const SizedBox(width: 12),
              Expanded(child: _numberField(label: 'Duration (min)', value: '$_duration', onChanged: (v) => _duration = int.tryParse(v) ?? _duration)),
            ])
          else
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                OutlinedButton.icon(onPressed: _loadTemplate, icon: const Icon(Icons.star), label: const Text('Load from saved')),
              ]),
              const SizedBox(height: 8),
              if (_exercises.isEmpty) const Text('No exercises yet.', style: TextStyle(color: Colors.black54)),
              ..._exercises.map((e) => ListTile(title: Text(e.name), subtitle: Text('${e.sets}x${e.reps}${e.weightKg != null ? ' @ ${e.weightKg}kg' : ''}'), trailing: IconButton(icon: const Icon(Icons.delete_outline), onPressed: () { setState(() { _exercises.remove(e); }); }))),
              const SizedBox(height: 8),
              _ExerciseAdder(onAdd: (ex) => setState(() => _exercises.add(ex))),
            ]),
          const SizedBox(height: 12),
          TextField(decoration: const InputDecoration(labelText: 'Notes'), maxLines: 3, controller: TextEditingController(text: _notes), onChanged: (v) => _notes = v),
          const SizedBox(height: 16),
          FilledButton.icon(onPressed: _save, icon: const Icon(Icons.save), label: const Text('Save')),
        ],
      ),
    );
  }

  Widget _numberField({required String label, required String value, required ValueChanged<String> onChanged}) {
    final controller = TextEditingController(text: value);
    return TextField(decoration: InputDecoration(labelText: label), keyboardType: TextInputType.numberWithOptions(decimal: true), controller: controller, onChanged: onChanged);
  }

  Future<void> _loadTemplate() async {
    final selected = await Navigator.of(context).push<CalisthenicsTemplate>(MaterialPageRoute(builder: (_) => const SelectTemplateScreen()));
    if (selected != null) {
      setState(() {
        _exercises
          ..clear()
          ..addAll(selected.exercises.map((e) => Exercise(name: e.name, sets: e.sets, reps: e.reps, weightKg: e.weightKg)));
      });
    }
  }

  Future<void> _save() async {
    final w = widget.workout
      ..dateTime = _dateTime
      ..type = _type
      ..durationMinutes = _type == WorkoutType.run ? _duration : null
      ..distanceKm = _type == WorkoutType.run ? _distance : null
      ..notes = _notes
      ..exercises = _type == WorkoutType.calisthenics ? List.of(_exercises) : [];
    await w.save();
    if (mounted) Navigator.of(context).pop();
  }
}

class _ExerciseAdder extends StatefulWidget {
  final ValueChanged<Exercise> onAdd;
  const _ExerciseAdder({required this.onAdd});
  @override
  State<_ExerciseAdder> createState() => _ExerciseAdderState();
}

class _ExerciseAdderState extends State<_ExerciseAdder> {
  final nameCtrl = TextEditingController(text: 'Push-ups');
  int sets = 3;
  int reps = 12;
  double weight = 0;
  @override
  Widget build(BuildContext context) {
    return Column(children: [
      TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Name')),
      Row(children: [
        Expanded(child: TextField(decoration: const InputDecoration(labelText: 'Sets'), keyboardType: TextInputType.number, onChanged: (v) => sets = int.tryParse(v) ?? sets, controller: TextEditingController(text: '$sets'))),
        const SizedBox(width: 8),
        Expanded(child: TextField(decoration: const InputDecoration(labelText: 'Reps'), keyboardType: TextInputType.number, onChanged: (v) => reps = int.tryParse(v) ?? reps, controller: TextEditingController(text: '$reps'))),
        const SizedBox(width: 8),
        Expanded(child: TextField(decoration: const InputDecoration(labelText: 'Weight (kg, optional)'), keyboardType: const TextInputType.numberWithOptions(decimal: true), onChanged: (v) => weight = double.tryParse(v) ?? weight, controller: TextEditingController(text: weight == 0 ? '' : '$weight'))),
      ]),
      const SizedBox(height: 8),
      OutlinedButton.icon(onPressed: () => widget.onAdd(Exercise(name: nameCtrl.text, sets: sets, reps: reps, weightKg: weight == 0 ? null : weight)), icon: const Icon(Icons.add), label: const Text('Add exercise')),
    ]);
  }
}

// ---------------- Saved Workouts (Templates) UI ----------------
class TemplatesScreen extends StatelessWidget {
  const TemplatesScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final box = Hive.box<CalisthenicsTemplate>('templates');
    return Scaffold(
      appBar: AppBar(title: const Text('Saved Workouts')),
      body: ValueListenableBuilder(
        valueListenable: box.listenable(),
        builder: (context, Box<CalisthenicsTemplate> b, _) {
          final all = b.values.toList();
          if (all.isEmpty) {
            return const Center(child: Text('No saved workouts yet. Tap + to create one.'));
          }
          return ListView.separated(
            itemCount: all.length,
            separatorBuilder: (_, __) => const Divider(height: 0),
            itemBuilder: (c, i) {
              final t = all[i];
              return ListTile(
                leading: const Icon(Icons.star),
                title: Text(t.name),
                subtitle: Text(t.exercises.map((e) => '${e.name} ${e.sets}x${e.reps}${e.weightKg != null ? ' @ ${e.weightKg}kg' : ''}').join(', '), maxLines: 2, overflow: TextOverflow.ellipsis),
                trailing: PopupMenuButton<String>(
                  onSelected: (v) async {
                    if (v == 'edit') {
                      await Navigator.of(context).push(MaterialPageRoute(builder: (_) => TemplateEditorScreen(template: t)));
                    } else if (v == 'delete') {
                      await t.delete();
                    }
                  },
                  itemBuilder: (c) => const [
                    PopupMenuItem(value: 'edit', child: Text('Edit')),
                    PopupMenuItem(value: 'delete', child: Text('Delete')),
                  ],
                ),
                onTap: () async {
                  await Navigator.of(context).push(MaterialPageRoute(builder: (_) => TemplateEditorScreen(template: t)));
                },
              );
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          await Navigator.of(context).push(MaterialPageRoute(builder: (_) => const TemplateEditorScreen()));
        },
        label: const Text('New'), icon: const Icon(Icons.add),
      ),
    );
  }
}

class TemplateEditorScreen extends StatefulWidget {
  final CalisthenicsTemplate? template;
  const TemplateEditorScreen({super.key, this.template});
  @override
  State<TemplateEditorScreen> createState() => _TemplateEditorScreenState();
}

class _TemplateEditorScreenState extends State<TemplateEditorScreen> {
  final nameCtrl = TextEditingController();
  final List<Exercise> _exercises = [];

  @override
  void initState() {
    super.initState();
    final t = widget.template;
    if (t != null) {
      nameCtrl.text = t.name;
      _exercises.addAll(t.exercises.map((e) => Exercise(name: e.name, sets: e.sets, reps: e.reps, weightKg: e.weightKg)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.template != null;
    return Scaffold(
      appBar: AppBar(title: Text(isEdit ? 'Edit Saved Workout' : 'New Saved Workout')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Name (e.g., Pull A)')),
          const SizedBox(height: 12),
          if (_exercises.isEmpty) const Text('Add exercises below.', style: TextStyle(color: Colors.black54)),
          ..._exercises.map((e) => ListTile(title: Text(e.name), subtitle: Text('${e.sets}x${e.reps}${e.weightKg != null ? ' @ ${e.weightKg}kg' : ''}'), trailing: IconButton(icon: const Icon(Icons.delete_outline), onPressed: () { setState(() { _exercises.remove(e); }); }))),
          const SizedBox(height: 8),
          _ExerciseAdder(onAdd: (ex) => setState(() => _exercises.add(ex))),
          const SizedBox(height: 16),
          FilledButton.icon(onPressed: _save, icon: const Icon(Icons.save), label: const Text('Save')),
        ],
      ),
    );
  }

  Future<void> _save() async {
    final name = nameCtrl.text.trim();
    if (name.isEmpty || _exercises.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please add a name and at least one exercise.')));
      return;
    }
    final box = Hive.box<CalisthenicsTemplate>('templates');
    if (widget.template == null) {
      final t = CalisthenicsTemplate(name: name, exercises: _exercises.map((e) => Exercise(name: e.name, sets: e.sets, reps: e.reps, weightKg: e.weightKg)).toList());
      await box.add(t);
    } else {
      widget.template!
        ..name = name
        ..exercises = _exercises.map((e) => Exercise(name: e.name, sets: e.sets, reps: e.reps, weightKg: e.weightKg)).toList();
      await widget.template!.save();
    }
    if (mounted) Navigator.of(context).pop();
  }
}

class SelectTemplateScreen extends StatelessWidget {
  const SelectTemplateScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final box = Hive.box<CalisthenicsTemplate>('templates');
    return Scaffold(
      appBar: AppBar(title: const Text('Choose Saved Workout')),
      body: ValueListenableBuilder(
        valueListenable: box.listenable(),
        builder: (context, Box<CalisthenicsTemplate> b, _) {
          final all = b.values.toList();
          if (all.isEmpty) return const Center(child: Text('No saved workouts yet.')); 
          return ListView.separated(
            itemCount: all.length,
            separatorBuilder: (_, __) => const Divider(height: 0),
            itemBuilder: (c, i) {
              final t = all[i];
              return ListTile(
                leading: const Icon(Icons.star),
                title: Text(t.name),
                subtitle: Text(t.exercises.map((e) => '${e.name} ${e.sets}x${e.reps}${e.weightKg != null ? ' @ ${e.weightKg}kg' : ''}').join(', '), maxLines: 2, overflow: TextOverflow.ellipsis),
                onTap: () => Navigator.of(context).pop(t),
              );
            },
          );
        },
      ),
    );
  }
}

// ---------------- helpers ----------------
Future<String?> _askForName(BuildContext context, {String? hint}) async {
  final controller = TextEditingController(text: hint ?? '');
  return showDialog<String>(context: context, builder: (c) => AlertDialog(
        title: const Text('Template name'),
        content: TextField(controller: controller, decoration: const InputDecoration(hintText: 'e.g., Push A')), 
        actions: [
          TextButton(onPressed: () => Navigator.pop(c), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(c, controller.text), child: const Text('Save')),
        ],
      ));
}
