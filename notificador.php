<?php
    $url = 'http://gateway/api/alert';

    $mensaje = 'Server status ok - ' . date('H:i');

    $data = json_encode(['message' => $mensaje]);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Content-Length: ' . strlen($data)
    ]);

    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($http_code === 200) {
        echo "Notificación enviada con éxito\n";
    } else {
        echo "Error al enviar: " . $response . "\n";
    }
