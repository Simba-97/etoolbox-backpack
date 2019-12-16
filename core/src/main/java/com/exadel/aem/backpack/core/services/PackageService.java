package com.exadel.aem.backpack.core.services;

import com.exadel.aem.backpack.core.dto.response.BuildPackageInfo;
import org.apache.sling.api.resource.ResourceResolver;

import java.util.Collection;
import java.util.List;

public interface PackageService {

	BuildPackageInfo buildPackage(ResourceResolver resourceResolver, Collection<String> paths, String pkgName, String packageGroup);
	List<String> getLatestPackageBuildInfo(String pkgName, String pkgGroupName);
}
