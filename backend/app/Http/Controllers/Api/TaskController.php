<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(): JsonResponse
    {
        $tasks = Task::with('category')->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $tasks,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => ['nullable', 'exists:categories,id'],
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', 'in:to_do,in_progress,completed'],
            'priority' => ['sometimes', 'in:low,medium,high'],
            'due_date' => ['nullable', 'date'],
        ]);

        $task = Task::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Task created successfully.',
            'data' => $task->load('category'),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $task = Task::findOrFail($id);

        $validated = $request->validate([
            'category_id' => ['sometimes', 'nullable', 'exists:categories,id'],
            'title' => ['sometimes', 'required', 'string', 'max:150'],
            'description' => ['sometimes', 'nullable', 'string'],
            'status' => ['sometimes', 'in:to_do,in_progress,completed'],
            'priority' => ['sometimes', 'in:low,medium,high'],
            'due_date' => ['sometimes', 'nullable', 'date'],
        ]);

        $task->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Task updated successfully.',
            'data' => $task->load('category'),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $task = Task::findOrFail($id);

        $task->delete();

        return response()->json([
            'success' => true,
            'message' => 'Task deleted successfully.',
        ]);
    }
}
