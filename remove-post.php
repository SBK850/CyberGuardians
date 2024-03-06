<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

$host = 'localhost';
$username = 'id21908789_seikou';
$password = 'Manchester2023)'; 
$database = 'id21908789_youthvibe';

// Create a new database connection
$conn = new mysqli($host, $username, $password, $database);

// Check for connection errors
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$postData = json_decode(file_get_contents('php://input'), true);
$carouselItemId = $postData['CarouselItemID'];

// SQL to delete the post based on user confirmation
$deleteSql = "DELETE FROM CarouselItems WHERE CarouselItemID = ?";
$deleteStmt = $conn->prepare($deleteSql);

// Check for errors in statement preparation
if (!$deleteStmt) {
    echo json_encode(['error' => $conn->error]);
    exit;
}

$deleteStmt->bind_param("i", $carouselItemId);
$deleteStmt->execute();

// Check for errors in statement execution
if ($deleteStmt->error) {
    echo json_encode(['error' => $deleteStmt->error]);
} else if ($deleteStmt->affected_rows > 0) {
    echo json_encode(['message' => 'Post removed successfully.']);
} else {
    echo json_encode(['message' => 'No post found or already removed.']);
}

$conn->close();
?>
