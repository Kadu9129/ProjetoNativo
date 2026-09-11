package com.example.mapaamigo.data

import com.google.gson.annotations.SerializedName

data class Pin(
    @SerializedName("_id") val id: String? = null,
    val name: String,
    val description: String,
    val latitude: Double,
    val longitude: Double
)
