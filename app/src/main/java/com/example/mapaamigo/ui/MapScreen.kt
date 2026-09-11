package com.example.mapaamigo.ui

import android.annotation.SuppressLint
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.mapaamigo.viewmodel.MapViewModel
import com.google.android.gms.location.LocationServices
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.*

@SuppressLint("MissingPermission")
@Composable
fun MapScreen(paddingValues: PaddingValues = PaddingValues(0.dp), viewModel: MapViewModel = viewModel()) {
    val pins by viewModel.pins
    val isLoading by viewModel.isLoading
    val error by viewModel.error
    
    val context = LocalContext.current
    val fusedLocationClient = remember { LocationServices.getFusedLocationProviderClient(context) }
    
    var showDialog by remember { mutableStateOf(false) }
    var pendingLatLng by remember { mutableStateOf<LatLng?>(null) }

    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(LatLng(-23.5505, -46.6333), 10f)
    }

    LaunchedEffect(Unit) {
        fusedLocationClient.lastLocation.addOnSuccessListener { location ->
            location?.let {
                val userLatLng = LatLng(it.latitude, it.longitude)
                cameraPositionState.move(CameraUpdateFactory.newLatLngZoom(userLatLng, 15f))
            }
        }
    }

    Box(modifier = Modifier.fillMaxSize().padding(paddingValues)) {
        GoogleMap(
            modifier = Modifier.fillMaxSize(),
            cameraPositionState = cameraPositionState,
            properties = MapProperties(isMyLocationEnabled = true),
            uiSettings = MapUiSettings(myLocationButtonEnabled = true),
            onMapClick = { latLng ->
                pendingLatLng = latLng
                showDialog = true
            }
        ) {
            pins.forEach { pin ->
                Marker(
                    state = MarkerState(position = LatLng(pin.latitude, pin.longitude)),
                    title = pin.name,
                    snippet = pin.description,
                    onInfoWindowLongClick = {
                        pin.id?.let { viewModel.deletePin(it) }
                    }
                )
            }
        }

        // Top Bar
        Card(
            modifier = Modifier
                .padding(16.dp)
                .align(Alignment.TopStart),
            shape = RoundedCornerShape(14.dp),
            elevation = CardDefaults.cardElevation(4.dp)
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(20.dp)
                        .background(MaterialTheme.colorScheme.primary, RoundedCornerShape(4.dp))
                )
                Spacer(modifier = Modifier.width(8.dp))
                Column {
                    Text("MapPin", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    Text("Tap the map to save a place", fontSize = 12.sp)
                }
            }
        }

        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.align(Alignment.BottomStart).padding(16.dp)
            )
        }

        error?.let {
            Snackbar(
                modifier = Modifier.align(Alignment.BottomCenter).padding(16.dp),
                action = {
                    Button(onClick = { viewModel.loadPins() }) {
                        Text("Retry")
                    }
                }
            ) {
                Text(it)
            }
        }
    }

    val currentLatLng = pendingLatLng
    if (showDialog && currentLatLng != null) {
        PinFormDialog(
            onDismiss = { showDialog = false },
            onSubmit = { name, description ->
                viewModel.createPin(name, description, currentLatLng.latitude, currentLatLng.longitude)
                showDialog = false
            }
        )
    }
}

@Composable
fun PinFormDialog(onDismiss: () -> Unit, onSubmit: (String, String) -> Unit) {
    var name by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("New Pin") },
        text = {
            Column {
                TextField(value = name, onValueChange = { name = it }, label = { Text("Name") })
                Spacer(modifier = Modifier.height(8.dp))
                TextField(value = description, onValueChange = { description = it }, label = { Text("Description") })
            }
        },
        confirmButton = {
            Button(onClick = { onSubmit(name, description) }) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
