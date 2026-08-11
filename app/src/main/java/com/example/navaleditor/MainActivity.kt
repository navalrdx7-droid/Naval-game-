package com.example.navaleditor

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import com.arthenica.ffmpegkit.FFmpegKit
import com.arthenica.ffmpegkit.ReturnCode
import java.io.File
import java.io.FileOutputStream

class MainActivity : AppCompatActivity() {

    private lateinit var tvStatus: TextView
    private lateinit var btnProcess: Button
    private var inputVideoUri: Uri? = null

    private val selectVideoLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == Activity.RESULT_OK && result.data != null) {
            inputVideoUri = result.data?.data
            tvStatus.text = "वीडियो सेलेक्ट हो गया है!"
            btnProcess.isEnabled = true
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        tvStatus = findViewById(R.id.tvStatus)
        val btnSelect: Button = findViewById(R.id.btnSelect)
        btnProcess = findViewById(R.id.btnProcess)

        btnSelect.setOnClickListener {
            val intent = Intent(Intent.ACTION_PICK, MediaStore.Video.Media.EXTERNAL_CONTENT_URI)
            selectVideoLauncher.launch(intent)
        }

        btnProcess.setOnClickListener {
            inputVideoUri?.let { uri ->
                tvStatus.text = "प्रोसेसिंग चालू है..."
                btnProcess.isEnabled = false
                trimVideo(uri)
            }
        }
    }

    private fun trimVideo(uri: Uri) {
        val inputFile = File(cacheDir, "input_video.mp4")
        contentResolver.openInputStream(uri)?.use { input ->
            FileOutputStream(inputFile).use { output ->
                input.copyTo(output)
            }
        }

        val outputFile = File(getExternalFilesDir(null), "trimmed_output_${System.currentTimeMillis()}.mp4")
        val command = "-i \"${inputFile.absolutePath}\" -ss 00:00:00 -t 5 -c copy \"${outputFile.absolutePath}\""

        FFmpegKit.executeAsync(command) { session ->
            val returnCode = session.returnCode
            runOnUiThread {
                if (ReturnCode.isSuccess(returnCode)) {
                    tvStatus.text = "एडिट सफल!\nफाइल सेव हुई:\n${outputFile.absolutePath}"
                    Toast.makeText(this, "Video Saved!", Toast.LENGTH_SHORT).show()
                } else {
                    tvStatus.text = "प्रोसेस फेल हो गई!"
                }
                btnProcess.isEnabled = true
            }
        }
    }
}
