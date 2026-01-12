import { taskRepo } from "./src/repositories/task.repo";

console.log("🧪 Verifying fix...");

try {
    const task = taskRepo.create({
        board_id: 3, // Assuming board 3 exists as per curl
        type: "issue",
        title: "Verification Task",
        description: "Created by verification script",
        status: "backlog", // This previously failed
        priority: "medium",
        reporter_id: 1, // Assuming user 1 exists
    });
    console.log("✅ Task created successfully:", task);
    
    // Cleanup
    taskRepo.delete(task.id);
    console.log("🧹 Cleanup done.");
} catch (e) {
    console.error("❌ Verification failed:", e);
    process.exit(1);
}
