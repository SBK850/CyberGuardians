<?php

$host = 'localhost';
$username = 'id21908789_seikou'; 
$password = 'Manchester2023)'; 
$database = 'id21908789_youthvibe'; 

$carouselItemId = isset($_POST['carouselItemId']) ? $_POST['carouselItemId'] : null;

$response = ['success' => false, 'message' => ''];

if ($carouselItemId) {
    try {
        $sql = "DELETE FROM CarouselItems WHERE CarouselItemID = :carouselItemId";
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':carouselItemId', $carouselItemId, PDO::PARAM_INT);
        
        if ($stmt->execute()) {
            $response['success'] = true;
            $response['message'] = 'Carousel item removed successfully.';
        } else {
            $response['message'] = 'Failed to remove the carousel item.';
        }
    } catch (PDOException $e) {
        $response['message'] = "Error removing carousel item: " . $e->getMessage();
    }
} else {
    $response['message'] = 'Carousel Item ID is required.';
}

header('Content-Type: application/json');
echo json_encode($response);
?>
