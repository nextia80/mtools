package com.mtools.api.md.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class MdFileService {

	private final Path mdRoot = Paths.get("../MD").toAbsolutePath().normalize();

	public List<MdFileInfo> findAll() throws IOException {
		if (!Files.exists(mdRoot)) {
			return List.of();
		}

		try (var stream = Files.walk(mdRoot)) {
			return stream
					.filter(Files::isRegularFile)
					.filter(path -> path.getFileName().toString().endsWith(".md"))
					.map(this::toMdFileInfo)
					.sorted(Comparator.comparing(MdFileInfo::path).reversed())
					.toList();
		}
	}

	public String read(String relativePath) throws IOException {
		Path targetPath = resolveMdFile(relativePath);
		return Files.readString(targetPath, StandardCharsets.UTF_8);
	}

	public void write(String relativePath, String content) throws IOException {
		Path targetPath = resolveMdFile(relativePath);
		Files.writeString(targetPath, content, StandardCharsets.UTF_8);
	}

	private MdFileInfo toMdFileInfo(Path path) {
		try {
			return new MdFileInfo(
					mdRoot.relativize(path).toString(),
					path.getFileName().toString(),
					Files.size(path),
					Instant.ofEpochMilli(Files.getLastModifiedTime(path).toMillis()).toString()
			);
		} catch (IOException e) {
			throw new IllegalStateException("MD 파일 정보를 읽을 수 없습니다: " + path, e);
		}
	}

	private Path resolveMdFile(String relativePath) throws IOException {
		Path targetPath = mdRoot.resolve(relativePath).normalize();

		if (!targetPath.startsWith(mdRoot) || !targetPath.getFileName().toString().endsWith(".md")) {
			throw new IllegalArgumentException("허용되지 않는 MD 파일 경로입니다.");
		}

		if (!Files.isRegularFile(targetPath)) {
			throw new IOException("MD 파일을 찾을 수 없습니다: " + relativePath);
		}

		return targetPath;
	}
}
