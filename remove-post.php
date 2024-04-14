<?php
header('Content-Type: application/json');

error_reporting(E_ALL);
ini_set('display_errors', 1);

$host = 'mudfoot.doc.stu.mmu.ac.uk';
$username = 'bahkaras';
$password = 'hirsponD3'; 
$database = 'bahkaras';
$port = 6306; 

$conn = new mysqli($host, $username, $password, $database, $port);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['error' => "Connection failed: " . $conn->connect_error]);
    exit;
}

$postData = json_decode(file_get_contents('php://input'), true);
$carouselItemId = isset($postData['CarouselItemID']) ? $postData['CarouselItemID'] : null;

if (null === $carouselItemId) {
    http_response_code(400);
    echo json_encode(['error' => 'CarouselItemID is required']);
    exit;
}

$deleteSql = "DELETE FROM CarouselItems WHERE CarouselItemID = ?";
$deleteStmt = $conn->prepare($deleteSql);

if (!$deleteStmt) {
    http_response_code(500);
    echo json_encode(['error' => $conn->error]);
    exit;
}

$deleteStmt->bind_param("i", $carouselItemId);
if ($deleteStmt->execute()) {
    if ($deleteStmt->affected_rows > 0) {
        echo json_encode(['message' => 'Post removed successfully.']);
    } else {
        echo json_encode(['message' => 'No post found or already removed.']);
    }
} else {
    http_response_code(500);
    echo json_encode(['error' => $deleteStmt->error]);
}

$deleteStmt->close();
$conn->close();
?>
