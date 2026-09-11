package com.example.mapaamigo.data

import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path

interface PinApiService {
    @GET("pins")
    suspend fun getPins(): List<Pin>

    @POST("pins")
    suspend fun createPin(@Body pin: Pin): Pin

    @DELETE("pins/{id}")
    suspend fun deletePin(@Path("id") id: String)
}
