package com.example.mapaamigo.viewmodel

import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.mapaamigo.data.Pin
import com.example.mapaamigo.data.RetrofitInstance
import kotlinx.coroutines.launch

class MapViewModel : ViewModel() {
    private val _pins = mutableStateOf<List<Pin>>(emptyList())
    val pins: State<List<Pin>> = _pins

    private val _isLoading = mutableStateOf(value = false)
    val isLoading: State<Boolean> = _isLoading

    private val _error = mutableStateOf<String?>(null)
    val error: State<String?> = _error

    init {
        loadPins()
    }

    fun loadPins() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                _pins.value = RetrofitInstance.api.getPins()
            } catch (e: Exception) {
                _error.value = "Failed to load pins: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun createPin(name: String, description: String, latitude: Double, longitude: Double) {
        viewModelScope.launch {
            try {
                val newPin = Pin(name = name, description = description, latitude = latitude, longitude = longitude)
                val createdPin = RetrofitInstance.api.createPin(newPin)
                _pins.value = listOf(createdPin) + _pins.value
            } catch (e: Exception) {
                _error.value = "Failed to create pin: ${e.message}"
            }
        }
    }

    fun deletePin(id: String) {
        viewModelScope.launch {
            try {
                RetrofitInstance.api.deletePin(id)
                _pins.value = _pins.value.filter { it.id != id }
            } catch (e: Exception) {
                _error.value = "Failed to delete pin: ${e.message}"
            }
        }
    }
}
